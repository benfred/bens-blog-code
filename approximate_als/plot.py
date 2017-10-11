# Modified from erikbern's version at
# https://github.com/erikbern/ann-benchmarks/blob/master/plot.py

import matplotlib.pyplot as plt
import seaborn  # noqa
import argparse

colours = {'annoy': "#2ca02c",
           'faiss': "#ff7f0e",
           'hnsw(nmslib)': "#1f77b4"}

label_overides = {'hnsw(nmslib)': 'nmslib (hnsw)',
                  'bruteforce0(nmslib)': 'bruteforce'}


def generate_plot(inputfile, outputfile, xlim):
    all_data = {}

    for line in open(inputfile):
        algo, algo_name, build_time, search_time, precision = line.strip().split(
            '\t')
        all_data.setdefault(algo, []).append(
            (algo_name, float(build_time), float(search_time), float(precision)))

    handles = []
    labels = []

    plt.figure(figsize=(7, 7))

    for algo in sorted(all_data.keys(), key=lambda x: x.lower()):
        data = all_data[algo]
        data.sort(key=lambda t: t[-2])  # sort by time
        ys = [1.0 / t[-2] for t in data]  # queries per second
        xs = [t[-1] for t in data]

        # Plot Pareto frontier
        xs, ys = [], []
        last_y = float('-inf')
        for t in data:
            y = t[-1]
            if y > last_y:
                last_y = y
                xs.append(t[-1])
                ys.append(1.0 / t[-2])
        label = label_overides.get(algo, algo)
        handle, = plt.plot(xs, ys, label=label, marker="o",
                           markersize=6, color=colours.get(algo, "#d62728"))
        handles.append(handle)
        labels.append(label)

    plt.gca().set_yscale('log')
    plt.gca().set_title(
        'Precision-Performance tradeoff - up and to the right is better')
    plt.gca().set_ylabel('Queries per second ($s^{-1}$) - larger is better')
    plt.gca().set_xlabel('10-NN precision - larger is better')
    plt.gca().legend(handles, labels, loc='center left',
                     bbox_to_anchor=(1, 0.5), prop={'size': 9})
    plt.xlim(xlim)
    plt.ylim([10, 10**5])
    plt.savefig(outputfile, bbox_inches='tight', dpi=300)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    generate_plot(args.input, args.output + ".png", [0, 1.03])
    generate_plot(args.input, args.output + "h.png", [0.99, 1.0002])
