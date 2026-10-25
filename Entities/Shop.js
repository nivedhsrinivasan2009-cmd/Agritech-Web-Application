{
  "name": "Shop",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Shop name"
    },
    "description": {
      "type": "string",
      "description": "Shop description"
    },
    "opening_hours": {
      "type": "string",
      "description": "Opening hours"
    },
    "location_id": {
      "type": "string",
      "description": "Associated location/zone ID"
    },
    "shop_type": {
      "type": "string",
      "enum": [
        "cafe",
        "farm_shop",
        "partner_outlet",
        "gift_shop"
      ],
      "description": "Type of shop"
    },
    "image_url": {
      "type": "string",
      "description": "Shop image URL"
    }
  },
  "required": [
    "name",
    "shop_type"
  ]
}