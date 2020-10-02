import setuptools
from distutils.command.build import build
from distutils.command.sdist import sdist
from distutils.command.bdist import bdist
from setuptools.command.develop import develop
import subprocess
import os

HERE = os.path.abspath(os.path.dirname(__file__))

def build_static_first(cls):
    """
    Return a command that builds static assets before calling command Cls
    """
    class Command(cls):
        def run(self):
            commands = [
                ["npm", "install"],
                ["npm", "run", "build"]
            ]
            for command in commands:
                subprocess.check_call(command, cwd=HERE)
            super().run()

    return Command


setuptools.setup(
    name="simplebook",
    version='0.0.9',
    url="https://github.com/alesheng/simplebook",
    author="Yuvi Panda, ale",
    author_email="ale@anlint.com",
    license="BSD 3-Clause",
    packages=setuptools.find_packages(),
    install_requires=['notebook'],
    python_requires='>=3.5',
    classifiers=[
        'Framework :: Jupyter',
    ],
    data_files=[
        ('etc/jupyter/jupyter_notebook_config.d', ['simplebook/etc/jupyter_notebook_config.d/simplebook-serverextension.json']),
    ],
    package_data={
        '': ['build/*', 'index.html']
    },
    zip_safe=False,
    cmdclass={
        # This doesn't actually when installing sdist
        "sdist": build_static_first(sdist),
        "bdist": build_static_first(bdist),
        "build": build_static_first(build),
        "develop": build_static_first(develop),
    },
    entry_points={
        'console_scripts': [
            'jupyter-simplebook = simplebook:main'
        ]
    }
)
