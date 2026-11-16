import { translate } from "../i18n/index.js";

export function distanceBetween(from, to) {
  if (!from || !to?.latitude || !to?.longitude) return null;
  const radians = (value) => (value * Math.PI) / 180;
  const deltaLat = radians(to.latitude - from.latitude);
  const deltaLon = radians(to.longitude - from.longitude);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(deltaLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function PoiCard({ poi, position, language, selected, onSelect }) {
  const distance = distanceBetween(position, poi.coordinates);
  const title = poi.name_translations?.[language] ?? poi.name;

  return (
    <button className={`poi-card${selected ? " poi-card--selected" : ""}`} onClick={() => onSelect(poi)} type="button">
      <span className="poi-card__image" style={{ backgroundImage: poi.image_url ? `url("${poi.image_url}")` : undefined }}>
        {!poi.image_url && <span aria-hidden="true">✦</span>}
        <span className="poi-card__category">{poi.category_translations?.[language] ?? poi.category}</span>
      </span>
      <span className="poi-card__body">
        <span className="poi-card__title">{title}</span>
        <span className="poi-card__meta">
          <span>{distance === null ? "⌖ District 4" : `⌖ ${distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`}`}</span>
          <span>{translate(language, "listen")} <span aria-hidden="true">↗</span></span>
        </span>
      </span>
    </button>
  );
}
