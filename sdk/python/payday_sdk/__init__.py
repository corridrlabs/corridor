"""
Corridor Connector SDK
Build custom connectors for the Corridor platform
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from enum import Enum
import httpx
import logging

__version__ = "1.0.0"

logger = logging.getLogger(__name__)


class ConnectorType(Enum):
    """Types of connectors"""
    PAYMENT = "payment"
    ERP = "erp"
    CRM = "crm"
    COMMUNICATION = "communication"
    STORAGE = "storage"
    ANALYTICS = "analytics"
    CUSTOM = "custom"


class AuthType(Enum):
    """Authentication types"""
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    BASIC = "basic"
    BEARER = "bearer"
    CUSTOM = "custom"


class BaseConnector(ABC):
    """
    Base connector class for building custom connectors.
    
    Example:
        ```python
        from corridor_sdk import BaseConnector, ConnectorType, AuthType
        
        class MyConnector(BaseConnector):
            def __init__(self, config):
                super().__init__(config)
                self.connector_type = ConnectorType.CUSTOM
                self.api_key = config.get("api_key")
            
            async def authenticate(self):
                # Your auth logic
                return True
            
            async def execute(self, action, params):
                if action == "send_message":
                    return await self.send_message(params)
                raise ValueError(f"Unknown action: {action}")
            
            def get_available_actions(self):
                return [
                    {
                        "name": "send_message",
                        "description": "Send a message",
                        "parameters": ["to", "message"]
                    }
                ]
        ```
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = self.__class__.__name__
        self.connector_type = ConnectorType.CUSTOM
        self.auth_type = AuthType.API_KEY
        self.rate_limit = config.get("rate_limit", 100)
        self.timeout = config.get("timeout", 30)
        self.client = None
    
    @abstractmethod
    async def authenticate(self) -> bool:
        """
        Authenticate with the external service.
        
        Returns:
            bool: True if authentication successful
        """
        pass
    
    @abstractmethod
    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an action using this connector.
        
        Args:
            action: The action to perform
            params: Parameters for the action
            
        Returns:
            Result of the action
        """
        pass
    
    @abstractmethod
    def get_available_actions(self) -> List[Dict[str, Any]]:
        """
        Get list of available actions.
        
        Returns:
            List of action definitions
        """
        pass
    
    def get_required_config_fields(self) -> List[str]:
        """Get list of required configuration fields"""
        return []
    
    async def validate_config(self) -> bool:
        """Validate connector configuration"""
        required = self.get_required_config_fields()
        for field in required:
            if field not in self.config:
                logger.error(f"Missing required config: {field}")
                return False
        return True
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to external service"""
        try:
            authenticated = await self.authenticate()
            return {
                "success": authenticated,
                "message": "Connection successful" if authenticated else "Authentication failed"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}"
            }
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get connector metadata"""
        return {
            "name": self.name,
            "type": self.connector_type.value,
            "auth_type": self.auth_type.value,
            "rate_limit": self.rate_limit,
            "actions": self.get_available_actions()
        }


class HTTPConnector(BaseConnector):
    """
    Base class for HTTP-based connectors.
    
    Provides common HTTP functionality.
    """
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.base_url = config.get("base_url")
        self.headers = config.get("headers", {})
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=self.headers,
            timeout=self.timeout
        )
    
    async def get(self, path: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GET request"""
        response = await self.client.get(path, params=params)
        response.raise_for_status()
        return response.json()
    
    async def post(self, path: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make POST request"""
        response = await self.client.post(path, json=data)
        response.raise_for_status()
        return response.json()
    
    async def put(self, path: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make PUT request"""
        response = await self.client.put(path, json=data)
        response.raise_for_status()
        return response.json()
    
    async def delete(self, path: str) -> Dict[str, Any]:
        """Make DELETE request"""
        response = await self.client.delete(path)
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close HTTP client"""
        if self.client:
            await self.client.aclose()


class ConnectorRegistry:
    """Registry for managing connectors"""
    
    _connectors: Dict[str, type] = {}
    
    @classmethod
    def register(cls, connector_class: type):
        """Register a connector class"""
        cls._connectors[connector_class.__name__] = connector_class
        return connector_class
    
    @classmethod
    def get(cls, name: str, config: Dict[str, Any]) -> Optional[BaseConnector]:
        """Get connector instance"""
        connector_class = cls._connectors.get(name)
        if connector_class:
            return connector_class(config)
        return None
    
    @classmethod
    def list_all(cls) -> List[str]:
        """List all registered connectors"""
        return list(cls._connectors.keys())


# Decorator for easy registration
def connector(cls):
    """Decorator to register a connector"""
    ConnectorRegistry.register(cls)
    return cls


__all__ = [
    "BaseConnector",
    "HTTPConnector",
    "ConnectorRegistry",
    "ConnectorType",
    "AuthType",
    "connector",
]
