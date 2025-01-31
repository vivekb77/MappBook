import React from 'react';
import { ResponsiveSankey, DefaultLink } from '@nivo/sankey';

interface OrderStats {
  count: number;
  totals: { [currency: string]: number };
  statusCounts: { [status: string]: number };
  statusTotals: { [status: string]: { [currency: string]: number } };
}

interface OrderFlowSankeyProps {
  orderStats: OrderStats;
}

type NodeType = 'total' | 'status' | 'currency';

interface CustomNodeData {
  id: string;
  nodeType: NodeType;
  count?: number;
  status?: string;
  currency?: string;
  amount?: number;
}

const COLORS = ['#F06292', '#F44336', '#EF5350', '#FF5722', '#FF8A65', '#4FC3F7', '#2196F3', '#1976D2', '#9C27B0', '#BA68C8', '#E91E63'];

const OrderFlowSankey: React.FC<OrderFlowSankeyProps> = ({ orderStats }) => {
  const { count, statusCounts, statusTotals } = orderStats;
  
  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (index: number): string => {
    return COLORS[index % COLORS.length];
  };

  const nodes: CustomNodeData[] = [
    {
      id: 'total_orders',
      nodeType: 'total',
      count,
    },
    
    ...Object.entries(statusCounts).map(([status, statusCount], index) => ({
      id: `status_${status}`,
      nodeType: 'status' as NodeType,
      status,
      count: statusCount,
    })),
    
    ...Object.entries(statusTotals).flatMap(([status, currencies]) =>
      Object.entries(currencies).map(([currency, amount]) => ({
        id: `${status}_${currency}`,
        nodeType: 'currency' as NodeType,
        currency,
        amount,
      }))
    )
  ];

  const maxCount = Math.max(...Object.values(statusCounts));
  const maxAmount = Math.max(
    ...Object.values(statusTotals).flatMap(currencies => 
      Object.values(currencies)
    )
  );

  const links = [
    ...Object.entries(statusCounts).map(([status, count], index) => ({
      source: 'total_orders',
      target: `status_${status}`,
      value: count * (maxAmount / maxCount),
    })),

    ...Object.entries(statusTotals).flatMap(([status, currencies]) =>
      Object.entries(currencies).map(([currency, amount]) => ({
        source: `status_${status}`,
        target: `${status}_${currency}`,
        value: amount,
      }))
    )
  ];

  return (
    <div className="w-full h-96">
      <ResponsiveSankey<CustomNodeData, DefaultLink>
        data={{ nodes, links }}
        margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
        align="justify"
        colors={({ id }) => {
          const nodeIndex = nodes.findIndex(node => node.id === id);
          return COLORS[nodeIndex % COLORS.length];
        }}
        nodeOpacity={0.9}
        nodeThickness={30}
        nodeInnerPadding={4}
        nodeSpacing={15}
        nodeBorderWidth={0}
        nodeBorderColor={{ theme: 'background' }}
        linkOpacity={0.7}
        linkHoverOpacity={0.7}
        linkBlendMode="multiply"
        linkContract={1}
        enableLinkGradient={true}
        isInteractive={false}
        label={({ id, nodeType, count, status, amount, currency }) => {
          switch (nodeType) {
            case 'total':
              return `${count}`;
            case 'status':
              return `${status}: ${count}`;
            case 'currency':
              return amount && currency ? formatCurrency(amount, currency) : id;
            default:
              return id;
          }
        }}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
        animate={true}
        motionConfig="gentle"
        layout="horizontal"
        sort="input"
      />
    </div>
  );
};

export default OrderFlowSankey;