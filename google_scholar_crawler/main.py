from datetime import datetime, timezone
from pathlib import Path
import json
import os
import re
import time

import yaml
from scholarly import scholarly


def profile_id():
    config = yaml.safe_load((Path(__file__).resolve().parents[1] / '_config.yml').read_text(encoding='utf-8'))
    identifier = (os.environ.get('GOOGLE_SCHOLAR_ID') or config.get('google_scholar_id') or '').strip()
    if not identifier:
        match = re.search(r'[?&]user=([\w-]+)', config.get('author', {}).get('googlescholar') or '')
        identifier = match.group(1) if match else ''
    if not re.fullmatch(r'[\w-]+', identifier) or identifier == 'YOUR_GOOGLE_SCHOLAR_ID':
        raise ValueError('Set google_scholar_id in _config.yml or the GOOGLE_SCHOLAR_ID Actions variable/secret to your public Scholar profile ID.')
    return identifier


def collect(identifier):
    for attempt in range(3):
        try:
            author = scholarly.search_author_id(identifier)
            scholarly.fill(author, sections=['basics', 'indices', 'counts', 'publications'])
            if author.get('scholar_id') != identifier:
                raise ValueError('Scholar returned a different profile.')
            if type(author.get('citedby')) is not int or author['citedby'] < 0:
                raise ValueError('Scholar returned no valid citation total.')
            author['updated'] = datetime.now(timezone.utc).isoformat()
            author['publications'] = {paper['author_pub_id']: paper for paper in author.get('publications', [])}
            return author
        except Exception:
            if attempt == 2:
                raise
            time.sleep(15 * (attempt + 1))


def main():
    author = collect(profile_id())
    results = Path(__file__).resolve().parent / 'results'
    results.mkdir(exist_ok=True)
    (results / 'gs_data.json').write_text(json.dumps(author, ensure_ascii=False), encoding='utf-8')
    shield = {'schemaVersion': 1, 'label': 'citations', 'message': str(author['citedby'])}
    (results / 'gs_data_shieldsio.json').write_text(json.dumps(shield), encoding='utf-8')
    print(f"Updated citation data for {author['name']}: {author['citedby']}")


if __name__ == '__main__':
    main()
