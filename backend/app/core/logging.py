import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] [%(name)s] [ReqID: %(process)d] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    logger = logging.getLogger("pixelkit")
    logger.setLevel(logging.INFO)
    return logger

logger = setup_logging()
