import unittest
import tempfile
import shutil
import subprocess
import sys
from pathlib import Path
import career_compass as core
from server import analyse, course_matches, compute_stats

class IntegrationTests(unittest.TestCase):
    def test_terminal_explore_save_and_reload_in_clean_directory(self):
        with tempfile.TemporaryDirectory() as folder:
            for name in ('career_compass.py', 'data.json'):
                shutil.copy(Path(__file__).with_name(name), folder)
            company = next(item for item in core.INDUSTRIES if item['roles'])
            inputs = f"2\n1\n1\n{company['id']}\n1\n0\n1\n2\n0\n"
            result = subprocess.run([sys.executable, 'career_compass.py'], cwd=folder,
                                    input=inputs, text=True, capture_output=True, timeout=15)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('Study plan saved', result.stdout)
            self.assertIn('Saved study plan', result.stdout)
            self.assertTrue((Path(folder) / 'profile.json').is_file())

    def test_terminal_handles_end_of_input(self):
        result = subprocess.run([sys.executable, str(Path(core.__file__))],
                                input='', text=True, capture_output=True, timeout=15)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('Input ended', result.stdout)

    def test_all_roles_shared_and_analysable(self):
        self.assertEqual(sum(len(c['roles']) for c in core.DATA['companies']), sum(len(i['roles']) for i in core.INDUSTRIES))
        for company in core.DATA['companies']:
            for role in company['roles']:
                for language in ('en', 'zh', 'ar'):
                    result = analyse({'uid': role['uid'], 'language': language})
                    self.assertEqual(result['missing'], role['skills'])
                    codes=[r['code'] for r in result['recommendations']]
                    self.assertEqual(len(codes), len(set(codes)))
                    self.assertTrue(all(c in core.COURSES for c in codes))
                self.assertEqual(analyse({'uid': role['uid'], 'mastered': role['skills']})['missing'], [])
    def test_course_matching(self):
        self.assertEqual(course_matches({'courses': []})['results'], [])
        results = course_matches({'courses': ['COMP9120']})['results']
        self.assertGreaterEqual(len(results), 11)
        self.assertEqual(len(results), len({item["uid"] for item in results}))
        self.assertTrue(all(link['code']=='COMP9120' for item in results for link in item['links']))
        with self.assertRaises(ValueError):
            course_matches({'courses':['INVALID']})

    def test_bad_inputs(self):
        for value in ([], {}, {'uid':'not-a-role'}, {'mastered':'Python'}):
            with self.assertRaises(ValueError):
                analyse(value)
    def test_skill_normalization(self):
        self.assertTrue(core.validate_dataset())
        self.assertEqual(core.normalize_skill('机器学习'), 'Machine Learning')
        self.assertEqual(core.normalize_skill('大模型'), 'LLM')
        self.assertEqual(core.normalize_skill('ROS2'), 'ROS')
        self.assertEqual(core.normalize_skill('Matlab'), 'MATLAB')
        for c in core.DATA['companies']:
            for r in c['roles']:
                for s in r['skills']:
                    self.assertFalse(any('\u4e00' <= ch <= '\u9fff' for ch in s), f'un-normalised skill: {s}')
                    self.assertIn(s, core.DATA['skill_labels'], f'missing label for {s}')

    def test_stats(self):
        stats = compute_stats()
        self.assertEqual(stats['companies'], len(core.DATA['companies']))
        self.assertEqual(stats['roles'], sum(len(c['roles']) for c in core.DATA['companies']))
        self.assertEqual(stats['confirmed_open'] + stats['published_not_confirmed'] + stats['historical_or_closed'], stats['roles'])
        self.assertEqual(stats['districts_verified'] + stats['districts_unverified'], stats['companies'])

    def test_save_load_and_corrupt_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path=str(Path(folder)/'profile.json')
            self.assertEqual(core.load_profile(path)[1], 'missing')
            self.assertTrue(core.save_profile({'target_role':'example'}, path))
            self.assertEqual(core.load_profile(path)[0]['target_role'], 'example')
            Path(path).write_text('{broken')
            self.assertEqual(core.load_profile(path)[1], 'corrupt')
            self.assertEqual(Path(path).read_text(), '{broken')

if __name__ == '__main__':
    unittest.main()
