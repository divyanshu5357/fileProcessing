from fastapi import HTTPException, status

class PixelKitException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)

class QuotaExceededException(PixelKitException):
    def __init__(self, detail: str = "Cloud storage quota exceeded. Upgrade your plan to upload more files."):
        super().__init__(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=detail)

class FileSizeLimitException(PixelKitException):
    def __init__(self, detail: str = "File size exceeds the plan maximum limit."):
        super().__init__(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=detail)

class UnauthorizedAccessException(PixelKitException):
    def __init__(self, detail: str = "Authentication required or session expired."):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

class ForbiddenFileAccessException(PixelKitException):
    def __init__(self, detail: str = "Access denied: You do not own this file resource."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class ResourceNotFoundException(PixelKitException):
    def __init__(self, detail: str = "The requested file or job could not be found."):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
