import logging
import grab.spider

from robots_database import RobotsDatabase


class RobotsCrawler(grab.spider.Spider):
    """ Simple grab spider to iterate through a list of urls, and store in
    sqllite database """

    def __init__(self, db, domainfile, *args, **kwargs):
        self.domainfile = domainfile
        self.db = db
        super(RobotsCrawler, self).__init__(*args, **kwargs)

    def valid_response_code(self, code, task):
        return True

    def task_generator(self):
        for line in open(self.domainfile):
            tokens = line.strip().split(',')
            if len(tokens) != 2:
                print("malformed line '%s'" % line)
                break

            rank = int(tokens[0].strip()) - 1
            domain = tokens[1].strip()

            if self.db.has_robots(domain):
                print("Skipping domain '%s'", domain)
                continue

            url = "http://%s/robots.txt" % domain
            yield grab.spider.Task('download', url=url, domain=domain, rank=rank,
                                   root=True, raw=True)

    def task_download(self, g, task):
        if g.doc.error_code:
            print('Request failed for "%s". Code %s  Reason: %s' % (task.domain, g.doc.error_code,
                                                                    g.doc.error_msg))
            if task.root:
                # try again on www. version
                url = "http://www.%s/robots.txt" % task.domain
                yield grab.spider.Task('download', url=url, domain=task.domain,
                                       rank=task.rank, root=False, raw=True)

            else:
                # insert into db so we don't necessarily retry, hack with negative statuscode
                self.db.insert(task.domain, task.url, task.rank,
                               -g.doc.error_code, g.doc.error_msg, None)

            return

        resp = g.doc
        self.db.insert(task.domain, task.url, task.rank,
                       resp.code, resp.unicode_body(), resp.headers)

        # try www version on 404 before giving up
        if g.doc.code == 404 and task.root:
            url = "http://www.%s/robots.txt" % task.domain
            yield grab.spider.Task('download', url=url, domain=task.domain,
                                   rank=task.rank, root=False, raw=True)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    import argparse
    parser = argparse.ArgumentParser(description="Crawls and analyzes robots.txt ",
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument('--db', type=str, default='robots.sqlite',
                        dest='dbfile', help='sqlite database to read/write files to')
    parser.add_argument('--crawl', type=str, required=True,
                        dest='crawl', help='Crawl domains from this file')
    parser.add_argument('--threads', type=int, default=10,
                        dest='threads', help='Number of concurrent requests to use in downloading')
    args = parser.parse_args()

    db = RobotsDatabase(args.dbfile)

    bot = RobotsCrawler(db, args.crawl, thread_number=args.threads)
    bot.run()
