from collections import defaultdict
import os

import pandas
from numpy import zeros, log, array
from scipy.sparse import csr_matrix


class MusicData(object):
    def __init__(self, filename):
        # load TSV file from disk
        self.data = pandas.read_table(filename,
                                      usecols=[0, 2, 3],
                                      names=['user', 'artist', 'plays'])

        # generate sets for artists/users
        self.artist_sets = dict((artist, set(users)) for artist, users in
                                self.data.groupby('artist')['user'])
        self.user_sets = dict((user, set(artists)) for user, artists in
                              self.data.groupby('user')['artist'])

        # assign each user a unique numeric id
        userids = defaultdict(lambda: len(userids))
        self.data['userid'] = self.data['user'].map(userids.__getitem__)

        # get a sparse vector for each artist
        self.artists = dict((artist,
                             csr_matrix((array(group['plays']),
                                         (zeros(len(group)),
                                         group['userid'])),
                                        shape=[1, len(userids)]))
                            for artist, group in self.data.groupby('artist'))

        N = len(self.artists)
        self.idf = [1. + log(N / (1. + p)) for p in self.data.groupby('userid').size()]
        self.average_plays = self.data['plays'].sum() / float(N)


def clean_dataset(filename):
    """ so - i lied a little in the post about it being a one line operation
    to read in the dataset with pandas.

    it *should* be a one line operation, but there are a bunch of malformed
    lines in the dataset that trips up pandas. So lets read in the thing one
    line at a time, and strip out the bad data. After this runs it will be a
    one-liner to read in. honest this time """

    with open(filename + ".cleaned", "wb") as output:
        for i, line in enumerate(open(filename)):
            tokens = line.strip().split("\t")
            if len(tokens) != 4:
                print "wrong # of tokens", i
                continue

            if not tokens[3].isdigit():
                print "non integer play count", i
                continue

            if tokens[2] == '""':
                print "invalid artist id", tokens[2]
                continue

            # some lines contain carriage returns (without newlines), which
            # randomly messes pandas up
            line = line.replace('\r', '')

            output.write(line)

    os.rename(filename, filename + ".messy")
    os.rename(filename + ".cleaned", filename)
