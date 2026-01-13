import math
import logging
from typing import Optional

# Setup logger to track coordinate issues in production
logger = logging.getLogger("utils.distance")

def calculate_haversine_distance(
    lat1: Optional[float], 
    lon1: Optional[float], 
    lat2: Optional[float], 
    lon2: Optional[float]
) -> Optional[float]:
    """
    Calculate the great-circle distance between two points 
    on the Earth (in Kilometers) using the Haversine formula.
    
    This is accurate to within 0.5%, which is excellent for 
    regional logistics in countries like Rwanda.
    
    Returns:
        float: Distance in km rounded to 2 decimal places.
        None: If any coordinate is missing or invalid.
    """
    
    # 1. Validation: Ensure all coordinates are provided and are valid numbers
    try:
        if any(v is None for v in [lat1, lon1, lat2, lon2]):
            return None
            
        # Ensure coordinates are within physical Earth bounds
        if not (-90 <= lat1 <= 90 and -180 <= lon1 <= 180):
            logger.warning(f"Invalid source coordinates: {lat1}, {lon1}")
            return None
        if not (-90 <= lat2 <= 90 and -180 <= lon2 <= 180):
            logger.warning(f"Invalid destination coordinates: {lat2}, {lon2}")
            return None

        # 2. Mathematical Constants
        # Earth's mean radius in kilometers (IUGG value)
        R = 6371.009

        # 3. Conversion and Calculation
        # Convert decimal degrees to radians
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        # Haversine core formula
        # a is the square of half the chord length between the points
        a = (math.sin(dphi / 2) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2)
        
        # c is the angular distance in radians
        # We use atan2 for better numerical stability than acos
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        # 4. Final Result
        distance = R * c
        return round(distance, 2)

    except (ValueError, TypeError) as e:
        logger.error(f"Distance calculation failed: {str(e)}")
        return None

def is_within_range(
    lat1: float, 
    lon1: float, 
    lat2: float, 
    lon2: float, 
    radius_km: float
) -> bool:
    """
    Helper utility to quickly check if a buyer is within a 
    certain radius of a farmer.
    """
    dist = calculate_haversine_distance(lat1, lon1, lat2, lon2)
    if dist is None:
        return False
    return dist <= radius_km