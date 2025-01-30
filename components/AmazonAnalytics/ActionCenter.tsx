import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, TrendingUp, AlertTriangle, DollarSign, Target, Settings } from 'lucide-react';

const ActionableInsights = () => {
  const insights = [
    {
      type: 'opportunity',
      title: 'High Growth Potential Detected',
      description: 'Sales in Seattle are 40% above average with minimal ad spend',
      action: 'Increase PPC budget by $500 in Seattle area',
      impact: 'Estimated revenue increase: $2,500/month',
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      priority: 'high'
    },
    {
      type: 'alert',
      title: 'Return Rate Warning',
      description: 'Return rates in Phoenix are 35% higher than average',
      action: 'Add heat-resistant packaging for summer months',
      impact: 'Potential savings: $1,200/month',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      priority: 'medium'
    },
    {
      type: 'optimization',
      title: 'Price Optimization',
      description: 'Premium product sales 3x higher in Beverly Hills',
      action: 'Test 15% price increase in high-income ZIP codes',
      impact: 'Projected margin increase: 22%',
      icon: <DollarSign className="w-5 h-5 text-blue-500" />,
      priority: 'medium'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Action Center</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure Alerts
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className="relative">
            <CardHeader>
              <div className="flex items-center gap-2">
                {insight.icon}
                <CardTitle className="text-lg">{insight.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Recommended Action
                </AlertTitle>
                <AlertDescription>{insight.action}</AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 mb-2">{insight.description}</p>
                  <p className="text-sm font-medium text-green-600">{insight.impact}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${
                    insight.priority === 'high' ? 'text-red-500' :
                    insight.priority === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)} Priority
                  </span>
                  <Button size="sm" className="flex items-center gap-1">
                    Take Action
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Action Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Review high-priority insights</h4>
                  <p className="text-sm text-gray-600">Focus on actions with highest revenue impact</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Implement regional price testing</h4>
                  <p className="text-sm text-gray-600">Start with highest-performing ZIP codes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Optimize shipping strategy</h4>
                  <p className="text-sm text-gray-600">Address high return rates in problem areas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActionableInsights;