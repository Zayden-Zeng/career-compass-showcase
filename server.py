"""Run python3 server.py, then open http://127.0.0.1:8766.
Standard-library local demonstration server. No third-party packages required.
"""
import argparse
import json
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import career_compass as core

WEB = Path(__file__).resolve().parent / 'web'


def analyse(payload):
    if not isinstance(payload, dict):
        raise ValueError('Expected a JSON object')
    uid = payload.get('uid')
    mastered = payload.get('mastered', [])
    language = payload.get('language', 'en')
    if language not in ('en', 'zh', 'ar'):
        raise ValueError('Unsupported language')
    if not isinstance(mastered, list) or len(mastered) > 200 or not all(isinstance(s, str) for s in mastered):
        raise ValueError('mastered must be a list of skill names')
    for company in core.DATA['companies']:
        for role in company['roles']:
            if role['uid'] == uid:
                if any(skill not in role['skills'] for skill in mastered):
                    raise ValueError('Unknown skill for this role')
                missing = core.get_missing_skills(role, mastered)
                recommendations, unmapped = core.recommend_courses(missing, language)
                return {'uid': uid, 'company': company['name'], 'title': role['title'],
                        'mastered': mastered, 'missing': missing,
                        'recommendations': recommendations, 'unmapped': unmapped,
                        'all_courses': core.recommend_courses(role['skills'], language)[0],
                        'source_url': role.get('source_url'), 'engine': 'Python'}
    raise ValueError('Unknown role')


def compute_stats():
    """Honest, evidence-stratified counts so the UI can avoid overstating
    the number of roles as if they were all live vacancies.
    """
    roles = [r for c in core.DATA['companies'] for r in c['roles']]
    by_status = {}
    for r in roles:
        s = r.get('status', 'unknown')
        by_status[s] = by_status.get(s, 0) + 1
    companies = core.DATA['companies']
    districts_verified = sum(1 for c in companies if c.get('district') and '待核实' not in c['district'])
    return {
        'companies': len(companies),
        'roles': len(roles),
        'courses': len(core.COURSES),
        'mapped_skills': len(core.SKILL_COURSES),
        'by_status': by_status,
        'confirmed_open': by_status.get('listed_open', 0),
        'published_not_confirmed': by_status.get('published_not_confirmed_open', 0),
        'historical_or_closed': by_status.get('historical', 0) + by_status.get('closed', 0),
        'districts_verified': districts_verified,
        'districts_unverified': len(companies) - districts_verified,
        'engine': 'Python',
    }


def course_matches(payload):
    if not isinstance(payload, dict):
        raise ValueError('Expected an object')
    courses = payload.get('courses', [])
    if not isinstance(courses, list) or not all(isinstance(c, str) and c in core.COURSES for c in courses):
        raise ValueError('Unknown course')
    selected = set(courses)
    results = []
    for company in core.DATA['companies']:
        for role in company['roles']:
            links = []
            for skill in role['skills']:
                for code, reason in core.SKILL_COURSES.get(skill, []):
                    if code in selected:
                        links.append({'skill': skill, 'code': code, 'reason': reason})
            if links:
                covered = {link['skill'] for link in links}
                results.append({'uid': role['uid'], 'links': links,
                    'covered_count': len(covered), 'total': len(role['skills']),
                    'remaining': [skill for skill in role['skills'] if skill not in covered]})
    results.sort(key=lambda item: (-item['covered_count'], item['uid']))
    return {'results': results, 'engine': 'Python'}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def reply(self, status, value, content_type='application/json; charset=utf-8'):
        body = value.encode('utf-8') if isinstance(value, str) else json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def send_error(self, code, message=None, explain=None):
        # A typo'd or auto-linked URL (e.g. a path that accidentally includes
        # punctuation after the host) should not show a bare 404 page; send the
        # visitor back to the app instead. Real API errors still use JSON 404.
        if code == 404 and not self.path.startswith('/api/'):
            self.send_response(302)
            self.send_header('Location', '/')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        super().send_error(code, message, explain)

    def do_GET(self):
        route = urlsplit(self.path).path
        if route == '/api/data.js':
            self.reply(200, 'window.COMPASS_DATA = ' + json.dumps(core.DATA, ensure_ascii=False) + ';', 'application/javascript; charset=utf-8')
        elif route == '/api/health':
            self.reply(200, {'engine': 'Python', 'companies': len(core.DATA['companies']),
                'roles': sum(len(c['roles']) for c in core.DATA['companies'])})
        elif route == '/api/stats':
            self.reply(200, compute_stats())
        elif route.startswith('/api/'):
            self.reply(404, {'error': 'Unknown endpoint'})
        else:
            super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path not in ('/api/analyse', '/api/course-matches'):
            self.reply(404, {'error': 'Unknown endpoint'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 16384:
                raise ValueError('Invalid request size')
            payload = json.loads(self.rfile.read(length))
            self.reply(200, course_matches(payload) if urlsplit(self.path).path == '/api/course-matches' else analyse(payload))
        except (ValueError, UnicodeDecodeError) as error:
            self.reply(400, {'error': str(error)})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8766)
    parser.add_argument('--no-browser', action='store_true',
                        help='Do not open a browser automatically')
    args = parser.parse_args()
    with ThreadingHTTPServer(('127.0.0.1', args.port), Handler) as server:
        url = f'http://127.0.0.1:{server.server_address[1]}/'
        print(f'Career Compass: {url}', flush=True)
        if not args.no_browser:
            def open_browser():
                try:
                    if not webbrowser.open(url):
                        print('Could not open a browser automatically; open the address above.', flush=True)
                except Exception as error:
                    print(f'Could not open a browser automatically: {error}. Open the address above.', flush=True)
            opener = threading.Timer(0.5, open_browser)
            opener.daemon = True
            opener.start()
        server.serve_forever()
