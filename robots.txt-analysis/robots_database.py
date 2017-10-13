from collections import namedtuple

import os
import threading
import time
import sqlite3


class RobotsDatabase(object):
    """ Simple storage of robots.txt files, using sqlite3 as a backend """
    def __init__(self, filename):
        if not os.path.exists(filename):
            self.create_tables(filename)

        self.db = sqlite3.connect(filename, check_same_thread=False)
        self.lock = threading.RLock()

    def create_tables(self, filename):
        # static method?
        db = sqlite3.connect(filename)
        c = db.cursor()
        try:
            c.execute("CREATE TABLE robotstxt (domain TEXT PRIMARY KEY, rank INT,"
                      "url TEXT, status_code INT, timestamp INT, body TEXT, headers TEXT)")
            db.commit()
        finally:
            c.close()

    def insert(self, domain, url, rank, status_code, body, headers):
        with self.lock:
            with self.db as c:
                c.execute("INSERT OR REPLACE into robotstxt (domain, url, rank, status_code, "
                          "timestamp, body, headers) VALUES(?, ?, ?, ?, ?, ?, ?)",
                          (domain, url, rank, status_code, int(time.time()), body, str(headers)))

    def has_robots(self, domain):
        with self.lock:
            cursor = self.db.execute("SELECT url, status_code from robotstxt where domain = ?",
                                     (domain,))
            try:
                for url, statuscode in cursor:
                    return True

                return False

            finally:
                cursor.close()

    Entry = namedtuple('RobotsDatabaseEntry', ['domain', 'rank', 'url', 'status_code',
                                               'timestamp', 'body', 'headers'])

    def __iter__(self):
        for row in self.db.execute("select * from robotstxt order by rank"):
            yield self.Entry(*row)

    def __getitem__(self, domain):
        for row in self.db.execute("select * from robotstxt where domain = ?", (domain, )):
            return self.Entry(*row)

    def __delitem__(self, domain):
        with self.lock:
            with self.db as c:
                c.execute("DELETE FROM robotstxt where domain = ?", (domain, ))
