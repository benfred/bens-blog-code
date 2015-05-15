from decorator import decorator

from scipy.sparse import csc_matrix
import scipy.sparse.compressed


def disable_matrix_checks():
    """ HACK: disable checking sparse matrices on multiply.
    almost doubles the speed some of these operations run at """
    def no_check(self, full_check=True):
        pass

    # store reference to original so we can undo if needed
    cs_matrix = scipy.sparse.compressed._cs_matrix
    cs_matrix.check_format_backup = cs_matrix.check_format
    cs_matrix.check_format = no_check


def reenable_matrix_checks():
    """ reverts performance hacks by disable_matrix_checks """
    cs_matrix = scipy.sparse.compressed._cs_matrix
    cs_matrix.check_format = cs_matrix.check_format_backup


@decorator
def store_result(f, v, *args, **kwargs):
    """ simple decorator to cache the output of functions, storing the
    cached value as an attribute on the first argument.
    Alternative to the standard 'memoize' decorator, with the rationale being
    that this lets us tie the lifetime of the cached value to the original
    object """
    key = f.__name__
    if hasattr(v, key):
        return getattr(v, key)

    ret = f(v, *args, **kwargs)
    setattr(v, key, ret)
    return ret


@decorator
def convert_csc(f, matrix, *args, **kwargs):
    """ decorator to convert csc matrices to/from csr matrixes.
    Some functions here assume csr matrix input. For performance reasons,
    they are occasionally passed csc matrices instead. hack around this """
    if (isinstance(matrix, csc_matrix)):
        return f(matrix.tocsr(), *args, **kwargs).tocsc()
    return f(matrix, *args, **kwargs)
