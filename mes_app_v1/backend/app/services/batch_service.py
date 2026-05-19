from app.models import CapsuleWeight, ComponentType

CAPSULE_RATIOS = {
    "250": (80, 170),
    "700": (200, 500),
    "1350": (350, 1000),
    "1630": (430, 1200),
}


def calculate_batch(capsule_weight: str, capsule_count: int, gelatin_components, filling_components):
    weight_mg = float(capsule_weight)
    total_mass_kg = weight_mg / 1_000_000 * capsule_count

    ratio = CAPSULE_RATIOS[capsule_weight]
    gelatin_part = ratio[0]
    filling_part = ratio[1]
    total_parts = gelatin_part + filling_part

    gelatin_mass_kg = total_mass_kg * gelatin_part / total_parts
    filling_mass_kg = total_mass_kg * filling_part / total_parts

    components = []
    for gc in gelatin_components:
        components.append({
            "type": ComponentType.gelatin,
            "name": gc.name,
            "percentage": gc.percentage,
            "required_kg": round(gelatin_mass_kg * gc.percentage / 100, 3),
            "order_index": gc.order_index,
        })

    for fc in filling_components:
        components.append({
            "type": ComponentType.filling,
            "name": fc.name,
            "percentage": fc.percentage,
            "required_kg": round(filling_mass_kg * fc.percentage / 100, 3),
            "order_index": fc.order_index,
        })

    return {
        "total_mass_kg": round(total_mass_kg, 3),
        "gelatin_mass_kg": round(gelatin_mass_kg, 3),
        "filling_mass_kg": round(filling_mass_kg, 3),
        "components": components,
    }
