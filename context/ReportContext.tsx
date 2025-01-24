// ReportContext.tsx
import { createContext, Dispatch, SetStateAction, useContext } from 'react';

interface ReportContextType {
 reportData: any | null;
 setReportData: Dispatch<SetStateAction<any | null>>;
}

export const ReportContext = createContext<ReportContextType | null>(null);

export const useReportContext = () => {
 const reportContext = useContext<ReportContextType | null>(ReportContext);
 const [reportData, setReportData] = reportContext 
   ? [reportContext.reportData, reportContext.setReportData] 
   : [null, () => {}];
 return { reportData, setReportData };
};