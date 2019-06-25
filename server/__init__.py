
__all__ = ['HttpMuxServer']



def assert_equal(left, right):
    if left == right:
        return True
    else:
        print('%s != %s\n' % (str(left), str(right)))
        assert(False)
        return False


def assert_not_equal(left, right):
    if left != right:
        return True
    else:
        print('%s == %s\n' % (str(left), str(right)))
        assert(False)
        return False


from .httpserver import HttpMuxServer

