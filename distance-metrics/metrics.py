""" Functions to compute similarity using various distance metrics """


import math

from numpy import ones, array, sqrt
from scipy.sparse import csr_matrix

from performance_hacks import store_result, convert_csc

# HACK: so, apparently using numpy.dot for sparse matrices doesn't actually
# work anymore (did on the older version of numpy/scipy I was using originally)
# rather than change the post and all the code, just hack around this by
# setting 'dot' to be the csr  version. in general this is pretty 
# terrible (should be doing a.dot(b) instead of dot(a, b))
dot = csr_matrix.dot


SMOOTHING = 20.
K1 = 100.
B = .5


# set distances
def overlap(a, b):
    return len(a.intersection(b))


def jaccard(a, b):
    intersection = float(len(a.intersection(b)))
    return intersection / (len(a) + len(b) - intersection)


def dice(a, b):
    intersection = float(len(a.intersection(b)))
    return 2 * intersection / (len(a) + len(b))


def ochiai(a, b):
    intersection = float(len(a.intersection(b)))
    return intersection / sqrt(len(a) * len(b))


# cosine distances
def cosine(a, b):
    return dot(a, b.T)[0, 0] / (norm2(a) * norm2(b))


@store_result
def norm2(artist):
    return sqrt((artist.data ** 2).sum())


def smoothed_cosine(a, b):
    # calculate set intersection by taking the dot product of the binary form
    overlap = dot(binarize(a), binarize(b).T)[0, 0]

    # smooth cosine by discounting
    return (overlap / (SMOOTHING + overlap)) * cosine(a, b)


@store_result
@convert_csc
def binarize(artist):
    ret = csr_matrix(artist)
    ret.data = ones(len(artist.data))
    return ret


# information retrieval measures
def tfidf(a, b, idf):
    return cosine(tfidf_weight(a, idf), tfidf_weight(b, idf))


@store_result
@convert_csc
def tfidf_weight(artist, idf):
    ret = csr_matrix(artist)
    ret.data = array([sqrt(plays) * idf[userid]
                      for plays, userid in zip(artist.data, artist.indices)])
    return ret


def bm25(a, b, idf, average_plays):
    return dot(bm25_weight(a, idf, average_plays),
               bm25_weight(b, idf, average_plays).T)[0, 0]


@store_result
@convert_csc
def bm25_weight(x, idf, average_plays):
    ret = csr_matrix(x)
    length_norm = ((1.0 - B) + B * float(sum(x.data)) / average_plays)
    ret.data = array([(plays * (K1 + 1.0) / (K1 * length_norm + plays)) * idf[userid]
                      for plays, userid in zip(ret.data, ret.indices)])
    return ret
