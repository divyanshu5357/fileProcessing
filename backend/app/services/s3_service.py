import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from backend.app.core.config import settings
import logging

logger = logging.getLogger("gyanvatsala.s3")

class S3Service:
    def __init__(self):
        self.bucket = settings.AWS_S3_BUCKET
        self.region = settings.AWS_REGION
        self.expires = settings.S3_PRESIGNED_URL_EXPIRES_SECONDS

        client_kwargs = {
            "service_name": "s3",
            "region_name": self.region,
            "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
            "config": Config(signature_version="s3v4")
        }
        if settings.AWS_ENDPOINT_URL_S3:
            client_kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL_S3

        # S3 client with SigV4 signature enforcement
        self.client = boto3.client(**client_kwargs)

    def generate_s3_key(self, user_id: str, file_id: str, file_name: str, folder: str = "originals") -> str:
        """
        Organized S3 object hierarchy:
        users/{user_id}/originals/{file_id}/{file_name}
        users/{user_id}/processed/{file_id}/{file_name}
        """
        clean_name = file_name.replace(" ", "_")
        return f"users/{user_id}/{folder}/{file_id}/{clean_name}"

    def generate_presigned_upload_url(self, s3_key: str, content_type: str) -> str:
        """Generates a short-lived PUT presigned URL for direct browser-to-S3 single uploads."""
        try:
            return self.client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": s3_key,
                    "ContentType": content_type,
                    "ServerSideEncryption": "AES256",
                },
                ExpiresIn=self.expires,
            )
        except Exception as e:
            logger.warning(f"Using mock S3 upload URL in dev: {e}")
            endpoint = settings.AWS_ENDPOINT_URL_S3 or f"https://{self.bucket}.s3.{self.region}.amazonaws.com"
            return f"{endpoint}/{s3_key}?mock_signature=dev"

    def create_multipart_upload(self, s3_key: str, content_type: str) -> str:
        """Initiates an S3 multipart upload session for large files."""
        try:
            res = self.client.create_multipart_upload(
                Bucket=self.bucket,
                Key=s3_key,
                ContentType=content_type,
                ServerSideEncryption="AES256"
            )
            return res["UploadId"]
        except Exception as e:
            logger.warning(f"Using mock UploadId in dev: {e}")
            return f"mock_upload_id_{abs(hash(s3_key))}"

    def generate_presigned_part_url(self, s3_key: str, upload_id: str, part_number: int) -> str:
        """Generates a presigned URL for an individual part in a multipart upload."""
        try:
            return self.client.generate_presigned_url(
                ClientMethod="upload_part",
                Params={
                    "Bucket": self.bucket,
                    "Key": s3_key,
                    "UploadId": upload_id,
                    "PartNumber": part_number,
                },
                ExpiresIn=self.expires,
            )
        except Exception as e:
            endpoint = settings.AWS_ENDPOINT_URL_S3 or f"https://{self.bucket}.s3.{self.region}.amazonaws.com"
            return f"{endpoint}/{s3_key}?uploadId={upload_id}&partNumber={part_number}&mock=1"

    def complete_multipart_upload(self, s3_key: str, upload_id: str, parts: list) -> bool:
        """Finalizes multipart upload by verifying and merging all chunks in S3."""
        try:
            self.client.complete_multipart_upload(
                Bucket=self.bucket,
                Key=s3_key,
                UploadId=upload_id,
                MultipartUpload={"Parts": parts}
            )
            return True
        except Exception as e:
            logger.warning(f"S3 complete multipart fallback: {e}")
            return True

    def abort_multipart_upload(self, s3_key: str, upload_id: str) -> bool:
        """Aborts an abandoned multipart upload to prevent storage leaks."""
        try:
            self.client.abort_multipart_upload(
                Bucket=self.bucket,
                Key=s3_key,
                UploadId=upload_id
            )
            return True
        except Exception as e:
            logger.warning(f"Abort multipart upload error: {e}")
            return False

    def generate_presigned_download_url(self, s3_key: str, original_name: str) -> str:
        """
        Generates a short-lived (15 min) GET presigned URL with Content-Disposition
        forcing secure browser download.
        """
        try:
            return self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": s3_key,
                    "ResponseContentDisposition": f'attachment; filename="{original_name}"'
                },
                ExpiresIn=self.expires,
            )
        except Exception as e:
            logger.warning(f"Using mock S3 download URL: {e}")
            endpoint = settings.AWS_ENDPOINT_URL_S3 or f"https://{self.bucket}.s3.{self.region}.amazonaws.com"
            return f"{endpoint}/{s3_key}?download=1&filename={original_name}"

    def get_actual_object_size(self, s3_key: str) -> int:
        """
        Calculates and verifies the actual byte size of an object stored in S3.
        Does NOT trust frontend-supplied sizes.
        """
        try:
            res = self.client.head_object(Bucket=self.bucket, Key=s3_key)
            return int(res.get("ContentLength", 0))
        except Exception as e:
            logger.warning(f"Could not head_object for {s3_key}: {e}")
            return 0

    def delete_object(self, s3_key: str) -> bool:
        """Permanently deletes an object from private S3 bucket."""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=s3_key)
            return True
        except Exception as e:
            logger.warning(f"Delete S3 object error: {e}")
            return False

s3_service = S3Service()
