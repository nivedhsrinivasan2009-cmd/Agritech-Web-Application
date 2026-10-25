{
  "name": "Event",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Event title"
    },
    "description": {
      "type": "string",
      "description": "Event description"
    },
    "start_time": {
      "type": "string",
      "format": "date-time",
      "description": "Event start time"
    },
    "end_time": {
      "type": "string",
      "format": "date-time",
      "description": "Event end time"
    },
    "category": {
      "type": "string",
      "enum": [
        "families",
        "schools",
        "entrepreneurs",
        "general"
      ],
      "description": "Event category"
    },
    "location_id": {
      "type": "string",
      "description": "Associated location/zone ID"
    },
    "image_url": {
      "type": "string",
      "description": "Event image URL"
    },
    "is_featured": {
      "type": "boolean",
      "default": false,
      "description": "Whether this event is featured in carousel"
    }
  },
  "required": [
    "title",
    "start_time",
    "category"
  ]
}