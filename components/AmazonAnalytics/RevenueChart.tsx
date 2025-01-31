import React, { useState, useEffect } from 'react';
import { ResponsiveSankey, DefaultLink } from '@nivo/sankey';
import { BarChart, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

const SankeyChart: React.FC<OrderFlowSankeyProps> = ({ orderStats }) => {
  const [isMobile, setIsMobile] = useState(false);
  const { count, statusCounts, statusTotals } = orderStats;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!count) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">No orders</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">Viewable on Desktop only</p>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const nodes: CustomNodeData[] = [
    {
      id: 'total_orders',
      nodeType: 'total',
      count,
    },
    ...Object.entries(statusCounts).map(([status, statusCount]) => ({
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
    ...Object.entries(statusCounts).map(([status, count]) => ({
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
    <div className="w-full h-full">
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

const OrderFlowSankey: React.FC<OrderFlowSankeyProps> = ({ orderStats }) => {
  return (
    <Dialog>
      <div className="flex justify-end w-full">
        <DialogTrigger asChild>
          <Button variant="outline" className="mb-2">
            <BarChart className="mr-2 h-4 w-4" />
            Revenue
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="w-[70%] max-w-[90vw] h-[500px] bg-white rounded-lg shadow-lg sm:max-w-[70%]">
        <DialogHeader className="sticky top-0 z-10 px-0 py-0">
          <DialogTitle className="text-xs font-semibold">Revenue Flow Analysis</DialogTitle>
        </DialogHeader>
        <div className="w-full h-[400px] p-6 overflow-y-auto">
          <div className="w-[95%] h-[400px]">
            <SankeyChart orderStats={orderStats} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFlowSankey;