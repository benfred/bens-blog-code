import logging
from urllib.parse import urlparse

try:
    from urllib.robotparser import RobotFileParser
except ImportError:
    # python2 compatibility
    from robotparser import RobotFileParser

import requests
import cld2

from robots_database import RobotsDatabase

log = logging.getLogger("robotstst")

KNOWN_LANGUAGES = {'zomato.com': 'English',
                   'instagram.com': 'English',
                   'khan.co.kr': 'Korean',
                   'lindaikejisblog.com': 'English',
                   'baidu.com': 'Chinese',
                   'baiducontent.com': 'Chinese'}

AD_NETWORKS = set("""onclkds.com
adf.ly
redonetype.com
deloton.com
pipeschannels.com
ioredi.com
bestadbid.com
higheurest.com
onclickads.net
newstarads.com
zulily.com
pejqoq4cafo3bg9yqqqtk5e6s6.com
quainator.com
haa66855mo.club
fbcdn.net
clickadu.com
xxlargepop.com
lindaikejisblog.com
naukri.com
linguee.com
naukrigulf.com
mudah.my
""".split())


def filter_googlebot(entries):
    """ Given a bunch of robots.txt entries, figure out if googlebot is allowed
    but other random bots are banned. yields tuples of (entry, reppy.Robots) objects
    that match this condition"""
    for entry in entries:
        if entry.status_code != 200:
            continue

        parser = RobotFileParser(entry.url)
        parser.parse(entry.body.split("\n"))

        if parser.can_fetch("GoogleBot", "/") and not parser.can_fetch("BensCoolBot", "/"):
            yield entry, parser


def get_language(entry):
    """ hacky language detection for domains. Downloads the index page, and runs
    cld2 on the html """
    index_url = entry.url.replace("robots.txt", "")

    # hack around some issues here,
    if entry.domain in KNOWN_LANGUAGES:
        language = KNOWN_LANGUAGES.get(entry.domain)

    else:
        try:
            page = requests.get(index_url)
            try:
                languages = cld2.detect(page.content, isPlainText=False,
                                        hintTopLevelDomain=entry.domain.split('.')[-1])
            except:
                languages = cld2.detect(page.text.encode("utf8"), isPlainText=False,
                                        hintTopLevelDomain=entry.domain.split('.')[-1])

            # ignoring 'is_reliable' flag here, set on baidu.com etc (even though detects
            # language appropiately
            language = languages.details[0].language_name if languages.details else 'Unknown'
            index_url = page.url

        except Exception as e:
            log.exception("Failed to analyze language for '%s'", entry.domain)
            language = 'Failed'

    language = language.title()
    # traditional chinese -> chinese
    if language == 'Chineset':
        language = 'Chinese'
    return language, not urlparse(index_url).netloc.endswith(entry.domain)


def analyze_googlebot(db, filename, check_languages=True, max_entries=200):
    with open(filename, 'w') as output:
        output.write("%s\t%s\t%s\t%s\n" % ("domain", "rank", "duckduckbot", "language"))
        for i, (entry, robots) in enumerate(filter_googlebot(db)):
            # not interested in showing ad networks, skip
            if entry.domain in AD_NETWORKS:
                continue

            language, redirected = get_language(entry) if check_languages else ('', False)
            if redirected:
                # if we were redirected off the domain entirely, almost certainly an adnetwork
                continue

            output.write("%s\t%s\t%s\t%s\n" % (entry.domain, entry.rank,
                                               robots.can_fetch("DuckDuckBot", "/"), language))

            if i >= max_entries:
                break


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    import argparse
    parser = argparse.ArgumentParser(description="Analyzes googlebot access in robots.txt files",
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument('--languages', action='store_true',
                        help='attempt to figure out page language')
    parser.add_argument('--max', type=int, default=200, help='max entries to find')
    parser.add_argument('--db', type=str, default='robots.sqlite',
                        help='sqlite database to read/write files to')
    parser.add_argument('--output', type=str, default='googlebot.tsv',
                        help='file to write results to')
    args = parser.parse_args()

    db = RobotsDatabase(args.db)
    analyze_googlebot(db, args.output, check_languages=args.languages, max_entries=args.max)
