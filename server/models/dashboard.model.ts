import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

export const Dashboard = defineMongooseModel('Dashboard', {
  userId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true },
  isDefault: { type: Boolean, default: false },

  // Layout configuration for widgets
  layoutConfig: [{
    i: { type: String, required: true }, // Widget ID
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true }, // Width
    h: { type: Number, required: true } // Height
  }],

  // Widget configurations
  widgetConfigs: [{
    id: { type: String, required: true },
    type: { type: String, required: true, enum: ['uptime', 'latency', 'errorRate', 'sslStatus', 'recentChecks'] },
    monitorId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Monitor', required: true },
    title: { type: String },
    config: { type: Object, default: {} } // Additional widget-specific configuration
  }]
}, {
  timestamps: true
})
