import json

from fastapi import Request
from fastapi.routing import APIRoute
from fastapi.responses import JSONResponse


def _camel_key(key: str) -> str:
    parts = key.split("_")
    return parts[0] + "".join(part[:1].upper() + part[1:] for part in parts[1:])


def frontend_compatible(value, *, top_level: bool = False):
    if isinstance(value, list):
        return [frontend_compatible(item) for item in value]
    if isinstance(value, dict):
        result = dict(value)
        for key, item in list(value.items()):
            camel = _camel_key(key)
            if camel != key:
                result.setdefault(camel, frontend_compatible(item))
            else:
                result[key] = frontend_compatible(item)
        if top_level:
            result.setdefault("success", True)
        return result
    return value


class CompatibleAPIRoute(APIRoute):
    """Keep existing snake_case fields and add aliases expected by the React client."""

    def get_route_handler(self):
        original_handler = super().get_route_handler()

        async def compatible_handler(request: Request):
            response = await original_handler(request)
            if response.media_type != "application/json" or not getattr(response, "body", None):
                return response
            try:
                payload = json.loads(response.body)
            except (ValueError, UnicodeDecodeError):
                return response
            return JSONResponse(
                content=frontend_compatible(payload, top_level=True),
                status_code=response.status_code,
                headers={key: value for key, value in response.headers.items() if key.lower() not in {"content-length", "content-type"}},
            )

        return compatible_handler
