import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useMemo } from 'react';

type Props = {
  lat: number | string;
  lng: number | string;
  title?: string;
  height?: number;  // px
  zoom?: number;
};

export default function MapView({ lat, lng, title, height = 280, zoom = 13 }: Props) {
  // Normalize to finite numbers
  const [clat, clng] = useMemo(() => {
    const nlat = typeof lat === 'string' ? Number(lat) : lat;
    const nlng = typeof lng === 'string' ? Number(lng) : lng;
    return [nlat, nlng];
  }, [lat, lng]);

  const valid = Number.isFinite(clat) && Number.isFinite(clng);
  if (!valid) return null;

  return (
    <div style={{ height, borderRadius: 12, overflow: 'hidden', border: '1px solid #333' }}>
      <MapContainer center={[clat as number, clng as number]} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[clat as number, clng as number]}>
          {title ? <Popup>{title}</Popup> : null}
        </Marker>
      </MapContainer>
    </div>
  );
}
