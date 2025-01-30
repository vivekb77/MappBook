import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, AlertTriangle, DollarSign, Target, 
  BarChart, Users, ShoppingCart, ArrowUpRight,
  Calendar, Box, RefreshCcw, Map
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockTimeSeriesData = [
  { month: 'Jan', sales: 4000, returns: 400 },
  { month: 'Feb', sales: 5000, returns: 300 },
  { month: 'Mar', sales: 6000, returns: 450 },
  // ... more data
];

const AdvancedInsightsDashboard = () => {
  const [activeTab, setActiveTab] = useState('predictive');

  const predictiveInsights = [
    {
      type: 'seasonal',
      title: 'Holiday Season Prep Alert',
      description: 'Based on historical data, prepare for 85% sales increase in winter gear',
      action: 'Increase inventory by 2000 units in Minnesota region',
      impact: 'Potential Revenue: $45,000',
      deadline: '45 days',
      confidence: '92%',
      icon: <Calendar className="w-5 h-5 text-blue-500" />
    },
    {
      type: 'inventory',
      title: 'Stock Optimization Required',
      description: 'Current stock levels will be insufficient for projected Q4 demand',
      action: 'Place advance orders for top 5 SKUs in Northeast',
      impact: 'Prevent $30,000 in lost sales',
      deadline: '30 days',
      confidence: '88%',
      icon: <Box className="w-5 h-5 text-purple-500" />
    }
  ];

  const competitorInsights = [
    {
      type: 'opportunity',
      title: 'Competitor Exit Detected',
      description: 'Major competitor reducing presence in Southwest region',
      action: 'Increase marketing spend in affected ZIP codes',
      impact: 'Estimated market share gain: 15%',
      priority: 'high',
      icon: <Target className="w-5 h-5 text-green-500" />
    }
  ];

  const returnAnalytics = {
    summary: {
      total_returns: '8.5%',
      problem_regions: ['Phoenix', 'Miami', 'Houston'],
      top_reasons: ['Size issues', 'Heat damage', 'Wrong color'],
      suggested_actions: [
        'Implement regional size guides',
        'Update packaging for hot weather',
        'Improve product images'
      ]
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advanced Analytics Center</h2>
        <Button variant="outline" size="sm">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="predictive">
            <TrendingUp className="w-4 h-4 mr-2" />
            Predictive Insights
          </TabsTrigger>
          <TabsTrigger value="competitor">
            <Target className="w-4 h-4 mr-2" />
            Competitor Analysis
          </TabsTrigger>
          <TabsTrigger value="returns">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Return Analytics
          </TabsTrigger>
          <TabsTrigger value="cohorts">
            <Users className="w-4 h-4 mr-2" />
            Customer Cohorts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictive">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI-Powered Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictiveInsights.map((insight, index) => (
                    <Alert key={index} className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        {insight.icon}
                        <AlertTitle>{insight.title}</AlertTitle>
                      </div>
                      <AlertDescription>
                        <div className="space-y-2">
                          <p>{insight.description}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-green-600">{insight.impact}</span>
                            <span className="text-gray-500">Confidence: {insight.confidence}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-orange-500">Deadline: {insight.deadline}</span>
                            <Button size="sm">Take Action</Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seasonal Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockTimeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#2563eb" />
                      <Line type="monotone" dataKey="returns" stroke="#dc2626" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitor">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                {competitorInsights.map((insight, index) => (
                  <Alert key={index}>
                    <div className="flex items-center gap-2 mb-2">
                      {insight.icon}
                      <AlertTitle>{insight.title}</AlertTitle>
                    </div>
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>{insight.description}</p>
                        <p className="text-green-600">{insight.impact}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-red-500">High Priority</span>
                          <Button size="sm">View Details</Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Competitive Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Market Share</span>
                    <span className="font-semibold">23%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Price Position</span>
                    <span className="font-semibold">Mid-range</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Review Rating</span>
                    <span className="font-semibold">4.5/5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Return Rate Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Problem Regions</h3>
                  {returnAnalytics.summary.problem_regions.map((region, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>{region}</span>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Top Return Reasons</h3>
                  {returnAnalytics.summary.top_reasons.map((reason, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>{reason}</span>
                      <span className="text-red-500">{(8 - index * 2)}%</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Recommended Actions</h3>
                  {returnAnalytics.summary.suggested_actions.map((action, index) => (
                    <Alert key={index}>
                      <AlertDescription>
                        <div className="flex justify-between items-center">
                          <span>{action}</span>
                          <Button size="sm">Apply</Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Lifetime Value by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span>Northeast</span>
                    <span className="font-semibold">$450 avg. LTV</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span>West Coast</span>
                    <span className="font-semibold">$380 avg. LTV</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                    <span>Midwest</span>
                    <span className="font-semibold">$320 avg. LTV</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Repeat Purchase Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTitle>High-Value Customer Zones</AlertTitle>
                    <AlertDescription>
                      <p>3 emerging regions detected with 40% higher repeat purchase rates</p>
                      <Button size="sm" className="mt-2">View Details</Button>
                    </AlertDescription>
                  </Alert>
                  <div className="p-4 bg-gray-50 rounded">
                    <h4 className="font-semibold mb-2">Retention Optimization</h4>
                    <p className="text-sm text-gray-600">Target these ZIP codes with loyalty programs:</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div>• 90210 (87% retention)</div>
                      <div>• 10001 (82% retention)</div>
                      <div>• 60601 (79% retention)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedInsightsDashboard;