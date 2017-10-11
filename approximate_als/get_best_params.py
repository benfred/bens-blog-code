from __future__ import print_function

import numpy
import pandas


def get_dataset(filename):
    data = numpy.load(filename)
    return data['train'], data['test']


def get_fastest_params(filename, min_precision=0.99):
    """ gets the fastest parameters over a given precision for a filename
    last run on lastfm50.txt is:
        Nmslib(method_name=hnsw, index_param=['M=32', 'post=2', 'efConstruction=800'], query_param=['ef=50']) 5.90481996536e-05 16935.3173486 0.99047
        Faiss(n_list=400, n_probe=20) 0.000164190196991 6090.49759563 0.99292
        Nmslib(method_name=seq_search, method_param=['copyMem=0']) 0.00962359979153 103.911220506 1.0
    """
    results = pandas.read_table(filename, names=['algo', 'params', 'buildtime', 'qps', 'precision'])
    good = results[results.precision >= min_precision]
    best = good.sort_values('qps').drop_duplicates('algo')
    return zip(best.params, best.qps, best.precision)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    args = parser.parse_args()

    for params, qps, precision in get_fastest_params(args.input):
        print(params, qps, 1.0 / qps, precision)
