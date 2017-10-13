from collections import defaultdict
import logging
import json
import os

from robots_database import RobotsDatabase

log = logging.getLogger("robotstst")


def analyze_jobads(db, filename, max_entries=100000, max_bots=100):
    seen_ads = defaultdict(list)
    found = 0

    # hack: read in domains that don't actually contain job ads,
    # but get tripped up by the heuristics we're using
    exclude_domains = set()
    exclude_filename = os.path.join(os.path.dirname(os.path.realpath(filename)),
                                    "exclude_job_domains.txt")
    if os.path.exists(exclude_filename):
        exclude_domains = set(l.strip() for l in open(exclude_filename))


    # another hack: force inclusion of some false negatives
    include_domains = {'dzone.com', 'agoda.com'}

    ads = []
    for i, entry in enumerate(db):
        comments = []
        lines = entry.body.split("\n")
        lines.append('')  # hack

        for line in lines:
            if line.startswith('#'):
                comments.append(line)
            else:
                if comments:
                    joined = "\n".join(comments)

                    if (joined not in seen_ads and
                            entry.domain not in exclude_domains):

                        lowered = joined.lower()
                        if ((entry.domain in include_domains) or
                                ('job' in lowered and 'job' not in entry.domain) or
                                ('career' in lowered and 'career' not in entry.domain)):
                            seen_ads[joined].append(entry.domain)
                            comments = []

                            ads.append({'domain': entry.domain,
                                        'url': entry.url,
                                        'rank': entry.rank,
                                        'text': joined})

                            seen_ads[joined].append(entry.domain)
                            comments = []
                            found += 1
                            break

                    seen_ads[joined].append(entry.domain)
                comments = []

        if i >= max_entries:
            break

    print("Found %i jobs" % found)

    # write out as a jsonp file
    with open(filename, "w") as output:
        output.write("var JOB_ADS = " + json.dumps(ads, indent=2) + ";")


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    import argparse
    parser = argparse.ArgumentParser(description="Analyzes jobads in robots.txt files",
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument('--max', type=int, default=1000000, help='max entries to find')
    parser.add_argument('--db', type=str, default='robots.sqlite',
                        help='sqlite database to read/write files to')
    parser.add_argument('--output', type=str, default='jobads.jsonp',
                        help='file to write output to')
    args = parser.parse_args()

    db = RobotsDatabase(args.db)
    analyze_jobads(db, args.output, max_entries=args.max)
