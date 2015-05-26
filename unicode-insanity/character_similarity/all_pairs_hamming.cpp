// a python extension to quickly calculate hamming distances between a large
// number of small images

#include <boost/python.hpp>
#include <boost/python/module.hpp>
#include <boost/python/def.hpp>

#include <vector>
#include <bitset>

using std::vector;
using std::bitset;

using boost::python::object;
using boost::python::list;
using boost::python::len;
using boost::python::def;
using boost::python::make_tuple;

/** Converts a list of image vectors into a c++ bitset representation,
std::bitset is a little weak in that we have to specify the number of
bits at compile time, but does let us easily do all the bit
operarations we need here */
template <size_t BITS>
void get_bitsets(object images,
                 vector<bitset<BITS> > * bitmaps) {
    for (int i = 0; i < len(images); ++i) {
        bitset<BITS> current;
        for (size_t j = 0; j < len(images[i]); ++j) {
            if (images[i][j]) {
                current.set(j);
            }
        }

        bitmaps->push_back(current);
    }
}

/** gets a list of all images that have a hamming distance <= threshold to
each other */
template <size_t BITS>
object all_pairs_hamming(object images, int threshold) {
    vector<bitset<BITS> > bitsets;
    get_bitsets<BITS>(images, &bitsets);

    list output;
    for (size_t i = 0; i < bitsets.size(); ++i) {
        for (size_t j = i + 1; j < bitsets.size(); ++j) {
            // calculate hamming distance by XOR'ing the two images, and
            // counting resulting set bits
            size_t hamming = (bitsets[i] ^ bitsets[j]).count();
            if (hamming <= threshold) {
                output.append(make_tuple(i, j, hamming));
            }
        }
    }
    return output;
}

/** bitset needs size specified at compile time - hack around that
by figurign out the size and calling the appropiate sized instance here */
object dispatch_all_pairs_hamming(object images, int threshold) {
    long bits = 0;
    for (size_t i = 0; i < len(images); ++i) {
        bits = std::max(bits, len(images[i]));
    }

    // 16x16
    if (bits <= 256) {
        return all_pairs_hamming<256>(images, threshold);

    // 32x32
    } else if (bits <= 1024) { 
        return all_pairs_hamming<1024>(images, threshold);

    // 64x64
    } else if (bits <= 4096) { 
        return all_pairs_hamming<4096>(images, threshold);

    // 128x128
    } else if (bits <= 16384) { 
        return all_pairs_hamming<16384>(images, threshold);
    }

    throw std::invalid_argument("max image size is 128x128");
}


BOOST_PYTHON_MODULE(all_pairs_hamming) {
    def("all_pairs_hamming", dispatch_all_pairs_hamming);
}
