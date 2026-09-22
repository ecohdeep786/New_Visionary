import { useLocation } from 'react-router-dom';

export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-white">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-[#5f6368]">404</h1>
                        <div className="h-0.5 w-16 bg-[#dadce0] mx-auto"></div>
                    </div>
                    
                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-[#121317]">
                            Page Not Found
                        </h2>
                        <p className="text-[#5f6368] leading-relaxed">
                            The page <span className="font-medium text-[#5f6368]">"{pageName}"</span> could not be found in this application.
                        </p>
                    </div>
                    
                    {/* Action Button */}
                    <div className="pt-6">
                        <button 
                            onClick={() => window.location.href = '/'} 
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#5f6368] bg-white border border-[#dadce0] rounded-lg hover:bg-[#121317]/5 hover:border-[#dadce0] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285F4]"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
