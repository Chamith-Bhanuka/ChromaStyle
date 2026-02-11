export const GARMENT_TEMPLATES = {
  shirt: {
    name: 'T-Shirt',
    category: 'Tops',
    path: 'M378.5,64.5c-15.8,18.1-40.6,22.1-61.9,12.6c-20.3-9-40.6-9-60.9,0c-21.3,9.4-46.1,5.5-61.9-12.6 C146.4,49.8,103.6,19.7,103.6,19.7L18.9,102.1l59.6,73.1l-18.2,279l393.4,0l-18.2-279l59.6-73.1l-84.7-82.4 C410.4,19.7,378.5,64.5,378.5,64.5z',
  },
  dress: {
    name: 'Dress',
    category: 'Tops',
    path: 'M180,60 C180,60 256,90 332,60 L380,120 L350,480 L162,480 L132,120 Z',
  },
  trousers: {
    name: 'Trousers',
    category: 'Bottoms',
    path: 'M360,60 L152,60 L140,160 L160,480 L230,480 L256,200 L282,480 L352,480 L372,160 Z',
  },
  shorts: {
    name: 'Shorts',
    category: 'Bottoms',
    path: 'M360,60 L152,60 L140,160 L160,300 L230,300 L256,180 L282,300 L352,300 L372,160 Z',
  },
  sneakers: {
    name: 'Sneakers',
    category: 'Footwear',
    path: 'M40,380 C40,380 40,320 80,280 C120,240 180,200 180,200 L220,160 C220,160 260,140 300,160 C340,180 380,220 420,220 C460,220 480,260 480,300 L480,380 L40,380 Z M300,380 L300,420 L480,420 L480,380 Z',
  },
  slippers: {
    name: 'Slippers',
    category: 'Footwear',
    path: 'M80,400 C80,350 140,340 180,360 L340,360 C380,360 400,380 400,420 L80,420 Z M180,360 C180,290 320,290 360,360 L180,360 Z',
  },
  heels: {
    name: 'High Heels',
    category: 'Footwear',
    path: 'M100,380 L140,380 L140,480 L120,480 L110,400 L60,400 L60,320 C60,280 120,280 140,320 L240,480 L320,480 L320,440 L260,380 L100,380 Z',
  },
};

export type GarmentType = keyof typeof GARMENT_TEMPLATES;
