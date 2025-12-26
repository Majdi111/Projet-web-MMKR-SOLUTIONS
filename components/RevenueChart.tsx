"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { hoverCard, hoverTransition } from "@/lib/motion"

// Revenue overview line chart
// Shows monthly revenue trend data

const data = [
  { name: "Jan", revenue: 13000 },
  { name: "Feb", revenue: 15000 },
  { name: "Mar", revenue: 18000 },
  { name: "Apr", revenue: 17000 },
  { name: "May", revenue: 20000 },
  { name: "Jun", revenue: 23000 },
]

export default function RevenueChart() {
  return (
    <motion.div whileHover={hoverCard} transition={hoverTransition}>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="name" stroke="#8884d8" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
