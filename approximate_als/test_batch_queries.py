""" Tests out batch queries for nmslib and Faiss (both on GPU/CPU)"""

import numpy
import pandas
import time

import faiss
import nmslib


class FaissIndex(object):

    def __init__(self, nlist=800, nprobe=50, gpu=False):
        self.nlist = nlist
        self.nprobe = nprobe
        self.gpu = gpu

    def fit(self, data):
        data = data.astype('float32')
        factors = data.shape[1]

        if self.gpu:
            self.res = faiss.StandardGpuResources()
            self.index = faiss.GpuIndexIVFFlat(self.res, factors, self.nlist,
                                               faiss.METRIC_INNER_PRODUCT)

        else:
            self.quantizer = faiss.IndexFlat(factors)
            self.index = faiss.IndexIVFFlat(self.quantizer, factors, self.nlist,
                                            faiss.METRIC_INNER_PRODUCT)

        self.index.train(data)
        self.index.add(data)
        self.index.nprobe = self.nprobe

    def query_batch(self, queries, n=10):
        return self.index.search(queries.astype('float32'), n)


class NMSLibIndex(object):

    def __init__(self, method, indexparams, queryparams):
        self.method = method
        self.indexparams = indexparams
        self.queryparams = queryparams

    def fit(self, data):
        self.index = nmslib.init(method=self.method, space='cosinesimil')
        self.index.addDataPointBatch(data)
        self.index.createIndex(self.indexparams, print_progress=True)

    def query_batch(self, queries, n=10):
        return self.index.knnQueryBatch(queries, n)


def run_experiment(datafile):
    # These parameters are the fastest available for precision > 0.99 on my system:
    # Nmslib(method_name=hnsw, index_param=['M=32', 'post=2', 'efConstruction=800'], query_param=['ef=50']) 5.90481996536e-05 16935.3173486 0.99047  # noqa
    # Faiss(n_list=400, n_probe=20) 0.000164190196991 6090.49759563 0.99292
    # Nmslib(method_name=seq_search, method_param=['copyMem=0'])
    # 0.00962359979153 103.911220506 1.0

    indices = {'faiss(gpu)': FaissIndex(nlist=400, nprobe=20, gpu=True),
               'faiss(cpu)': FaissIndex(nlist=400, nprobe=20, gpu=False),
               'nmslib(hnsw)': NMSLibIndex(method='hnsw',
                                           indexparams=[
                                               'M=32', 'post=2', 'efConstruction=800'],
                                           queryparams=['ef=50'])}

    data = numpy.load(datafile)
    train, test = data['train'], data['queries']

    data = []

    for name, index in indices.items():
        print("Training model '%s'", name)
        start = time.time()
        index.fit(train)
        print("Trained model '%s' in", name, time.time() - start)
        for i in range(5):
            start = time.time()
            index.query_batch(test)
            query_time = time.time() - start
            data.append((name, query_time, test.shape[0]))
            print("%s: finished %i queries in %s (%s qps)" %
                  (name, test.shape[0], query_time, float(test.shape[0]) / query_time))

    df = pandas.DataFrame(data, columns=['algorithm', 'time', 'queries'])
    df['qps'] = df['queries'] / df['time']
    return df


def plot_output(df, filename):
    import seaborn
    import matplotlib

    colours = ['#ff7f0e', '#1f77b4', '#c5b0d5']
    ax = seaborn.barplot(y='qps', x='algorithm', data=df,
                         order=['faiss(cpu)', 'nmslib(hnsw)', 'faiss(gpu)'],
                         errwidth=1.5, palette=colours)
    ax.set_ylabel('Queries Per Second')
    ax.set_xlabel('Index')
    matplotlib.pyplot.savefig(filename, dpi=300)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    df = run_experiment(args.input)
    plot_output(df, args.output)
