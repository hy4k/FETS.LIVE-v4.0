import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StaffBranchSelectorProps {
    onSelect: (data: { staffId: string; branchId: string; staffName: string }) => void;
    onClose: () => void;
}

export const StaffBranchSelector: React.FC<StaffBranchSelectorProps> = ({ onSelect, onClose }) => {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');

    const branches = ['cochin', 'calicut', 'kannur', 'trivandrum'];

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('staff_profiles')
            .select('user_id, full_name, branch_assigned')
            .order('full_name');

        if (!error && data) {
            setStaff(data);
        }
        setLoading(false);
    };

    const handleConfirm = () => {
        const selectedStaff = staff.find(s => s.user_id === selectedStaffId);
        if (selectedStaffId && selectedBranch) {
            onSelect({
                staffId: selectedStaffId,
                branchId: selectedBranch,
                staffName: selectedStaff?.full_name || 'Unknown'
            });
        }
    };

    const neumorphicCard = "bg-[#e0e5ec] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] rounded-[2rem] border border-white/20";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] rounded-xl border-none p-4 w-full outline-none text-gray-700 font-bold";
    const neumorphicBtn = "px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 w-full mt-8";

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`${neumorphicCard} w-full max-w-md p-10 relative`}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] text-gray-400 hover:text-gray-600 transition-all"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-amber-500 rounded-2xl shadow-lg flex items-center justify-center text-white mx-auto mb-4">
                        <Users size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-700 uppercase tracking-tight">Identity <span className="text-amber-600">Verification</span></h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Select Operator and Deployment Centre</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
                            <MapPin size={12} className="text-amber-500" /> Selective Centre
                        </label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className={neumorphicInset}
                        >
                            <option value="">Select Centre...</option>
                            {branches.map(b => (
                                <option key={b} value={b}>{b.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
                            <Users size={12} className="text-amber-500" /> Active Staff
                        </label>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className={neumorphicInset}
                            disabled={loading}
                        >
                            <option value="">{loading ? 'Syncing Staff...' : 'Select Staff Member...'}</option>
                            {staff.map(s => (
                                <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!selectedStaffId || !selectedBranch}
                        className={neumorphicBtn}
                    >
                        <span>Initialize Protocol</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
