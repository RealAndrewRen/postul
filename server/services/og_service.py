"""Service for fetching OG images from URLs."""

import asyncio
import logging
from typing import Optional
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from html.parser import HTMLParser

logger = logging.getLogger(__name__)


class OGImageParser(HTMLParser):
    """HTML parser to extract OG image URL from meta tags."""

    def __init__(self):
        super().__init__()
        self.og_image: Optional[str] = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]):
        """Handle start tags, looking for og:image meta tags."""
        if tag == "meta":
            attrs_dict = dict(attrs)
            property_attr = attrs_dict.get("property") or attrs_dict.get("name", "")
            content = attrs_dict.get("content", "")

            if property_attr.lower() == "og:image" and content:
                self.og_image = content.strip()


class OGImageService:
    """Service for fetching OG images from URLs."""

    def __init__(self):
        self._client = None

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        return None

    async def fetch_og_image(self, url: str) -> Optional[str]:
        """
        Fetch OG image URL from a webpage.

        Args:
            url: The URL of the webpage to fetch OG image from

        Returns:
            OG image URL if found, None otherwise
        """
        try:
            # Validate URL
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                logger.warning(f"Invalid URL format: {url}")
                return None

            # Fetch HTML content asynchronously
            loop = asyncio.get_event_loop()
            html_content = await loop.run_in_executor(None, self._fetch_html, url)

            if not html_content:
                return None

            # Parse HTML to extract OG image
            parser = OGImageParser()
            parser.feed(html_content)

            if parser.og_image:
                # Convert relative URLs to absolute
                og_image_url = urljoin(url, parser.og_image)
                logger.debug(f"Found OG image for {url}: {og_image_url}")
                return og_image_url

            logger.debug(f"No OG image found for {url}")
            return None

        except Exception as e:
            logger.warning(f"Error fetching OG image from {url}: {e}")
            return None

    def _fetch_html(self, url: str, timeout: int = 10) -> Optional[str]:
        """
        Synchronously fetch HTML content from URL.

        Args:
            url: The URL to fetch
            timeout: Request timeout in seconds

        Returns:
            HTML content as string, or None if fetch fails
        """
        try:
            # Create request with user agent to avoid blocking
            req = Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
            )

            with urlopen(req, timeout=timeout) as response:
                # Read content and decode
                content = response.read()
                # Try to detect encoding from response headers
                encoding = response.headers.get_content_charset() or "utf-8"
                html_content = content.decode(encoding, errors="ignore")
                return html_content

        except Exception as e:
            logger.debug(f"Failed to fetch HTML from {url}: {e}")
            return None
