"""PR DESECHABLE (regla 15 del kit): demo en rojo del job `python`. Se cierra sin mergear."""


def test_demo_en_rojo_del_job_python() -> None:
    assert 1 == 2, "demo en rojo: el job python debe fallar nombrando este test"
