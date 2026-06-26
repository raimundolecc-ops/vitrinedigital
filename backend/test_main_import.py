import pathlib
import sys


def test_backend_main_can_import():
    root = pathlib.Path(__file__).resolve().parents[1]
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))

    import backend.main as main_module

    assert hasattr(main_module, "app")
