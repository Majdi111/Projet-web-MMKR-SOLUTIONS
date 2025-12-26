"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { hoverCard, hoverTransition } from "@/lib/motion"

// Invoice status pie chart
// Displays paid, pending, and overdue invoice counts

const COLORS = ["#140aa0ff", "#fbbf24", "#d81919ff"]
const data = [
  { name: "Paid", value: 68 },
  { name: "Pending", value: 25 },
  { name: "Overdue", value: 7 },
]

export default function InvoiceChart() {
  return (
    <motion.div whileHover={hoverCard} transition={hoverTransition}>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Invoice Status</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                fill="#8884d8"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
