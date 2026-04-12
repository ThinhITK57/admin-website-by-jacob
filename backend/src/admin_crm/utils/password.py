"""Password hashing utilities using Argon2."""

from argon2 import PasswordHasher
from argon2.exceptions import HashingError, VerificationError, VerifyMismatchError

# Argon2id hasher with secure defaults
_hasher = PasswordHasher(
    time_cost=3,        # Number of iterations
    memory_cost=65536,  # 64 MB memory usage
    parallelism=4,      # Parallel threads
    hash_len=32,        # Hash output length
    salt_len=16,        # Salt length
)


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id.

    Args:
        password: The plaintext password to hash.

    Returns:
        The Argon2id hash string.

    Raises:
        HashingError: If hashing fails.
    """
    return _hasher.hash(password)


def verify_password(password: str, hash_str: str) -> bool:
    """Verify a plaintext password against an Argon2id hash.

    Args:
        password: The plaintext password to verify.
        hash_str: The stored Argon2id hash.

    Returns:
        True if the password matches, False otherwise.
    """
    try:
        return _hasher.verify(hash_str, password)
    except (VerifyMismatchError, VerificationError):
        return False


def needs_rehash(hash_str: str) -> bool:
    """Check if a hash needs to be rehashed (e.g., after changing parameters).

    Args:
        hash_str: The stored hash to check.

    Returns:
        True if the hash should be rehashed.
    """
    return _hasher.check_needs_rehash(hash_str)
