from collections import defaultdict
import logging
try:
    from urllib.robotparser import RobotFileParser
except ImportError:
    # python2 compatibility
    from robotparser import RobotFileParser

from robots_database import RobotsDatabase

log = logging.getLogger("robotstst")

# manually classified top offenders here, map useragent: type/info/company/homepage
BOT_TYPES = {
    'AhrefsBot': ('SEO',  'http://ahrefs.com/robot', 'Ahrefs', 'https://ahrefs.com/'),
    'MJ12bot': ('SEO',  'http://mj12bot.com/', 'Majestic', 'http://www.majestic.com'),
    'ia_archiver': ('SEO', 'https://support.alexa.com/hc/en-us/articles/200450194-Alexa-s-Web-and-Site-Audit-Crawlers', 'Alexa', 'https://www.alexa.com/'),
    'Baiduspider': ('Search Engine', 'http://help.baidu.com/question?prod_en=master&class=Baiduspider', 'Baidu', 'http://www.baidu.com'),
    'MJ12bot': ('SEO',  'http://mj12bot.com/', 'Majestic', 'http://www.majestic.com'),
    'WebCopier': ('Archival',  'http://www.maximumsoft.com/index.htm', 'MaximumSoft', 'http://www.maximumsoft.com/index.htm'),
    'WebStripper': ('Archival', 'http://download.cnet.com/WebStripper/3000-2377_4-10046091.html', '', ''),
    'Teleport': ('Archival',  'http://www.tenmax.com/teleport/pro/home.htm', 'Teleport Pro', 'http://www.tenmax.com'),
    'Offline Explorer': ('Archival',  'http://www.metaproducts.com/Offline_Explorer.htm', 'MetaProducts Systems', 'http://www.metaproducts.com'),
    'SiteSnagger': ('Archival',  'https://www.pcmag.com/article2/0,2817,24421,00.asp', '', ''),
    'TeleportPro': ('Archival',  'http://www.tenmax.com/teleport/pro/home.htm', 'Teleport Pro', 'http://www.tenmax.com'),
    'Nutch': ('Search Engine', 'http://nutch.apache.org/bot.html', '', ''),
    'BLEXBot': ('SEO', 'http://webmeup-crawler.com/', 'WebMeUp', 'http://webmeup.com/'),
    'SemrushBot': ('SEO',  'https://www.semrush.com/bot/', 'SEMRush', 'http://www.semrush.com'),
    'Yandex': ('Search Engine',  'https://yandex.com/support/search/robots/user-agent.html', 'Yandex', 'https://yandex.com'),
    'psbot': ('Search Engine',  'http://www.picsearch.com/bot.html', 'Picsearch', 'http://www.picsearch.com'),
    'EmailCollector': ('Spam Scraper',  '', '', ''),
    'EmailSiphon': ('Spam Scraper',  '', '', ''),
    'MSIECrawler': ('Archival',  '', '', ''),
    'larbin': ('Unknown', '', '', ''),
    'moget': ('Unknown', '', '', ''),
}

DEFAULT_USERAGENT_URL = 'http://www.useragentstring.com/pages/useragentstring.php?name=%s'


def analyze_badbots(db, filename, max_entries=100000, max_bots=100):
    useragents = defaultdict(int)

    for i, entry in enumerate(db):
        parser = RobotFileParser(entry.url)
        parser.parse(entry.body.split("\n"))

        bans = [e for e in parser.entries if len(e.rulelines) == 1 and
                not e.rulelines[0].allowance and e.rulelines[0].path == '/']

        for ban in bans:
            for useragent in ban.useragents:
                useragents[useragent] += 1

        if i >= max_entries:
            break

    useragents = sorted(useragents.items(), key=lambda x: -x[1])
    with open(filename, "w") as output:
        output.write("useragent\tcount\ttype\tinfolink\tcompany\thomepage\n")
        for useragent, count in useragents[:max_bots]:
            agenttype, info, company, homepage = BOT_TYPES.get(useragent, ('', '', '', ''))
            if not info:
                info = DEFAULT_USERAGENT_URL % useragent
            output.write("%s\t%s\t%s\t%s\t%s\t%s\n" % (useragent, count, agenttype, info,
                                                       company, homepage))

    return useragents


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    import argparse
    parser = argparse.ArgumentParser(description="Analyzes badbot access in robots.txt files",
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument('--max', type=int, default=1000000, help='max entries to find')
    parser.add_argument('--db', type=str, default='robots.sqlite',
                        help='sqlite database to read/write files to')
    parser.add_argument('--output', type=str, default='badbots.tsv',
                        help='file to write output to')
    args = parser.parse_args()

    db = RobotsDatabase(args.db)
    analyze_badbots(db, args.output, max_entries=args.max)
