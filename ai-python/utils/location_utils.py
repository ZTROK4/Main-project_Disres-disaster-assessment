from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="DisRes_AI")

def extract_location_from_text(doc):
    places = [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC", "FAC"]]

    if not places:
        return {"raw_location": None, "coordinates": None}

    raw = places[0]
    try:
        geo = geolocator.geocode(raw)
        if geo:
            return {
                "raw_location": raw,
                "coordinates": {"lat": geo.latitude, "lon": geo.longitude}
            }
    except:
        pass

    return {"raw_location": raw, "coordinates": None}
