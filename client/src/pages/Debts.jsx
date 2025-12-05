import { useState } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useDebt } from '../context/DebtContext';
import DebtList from '../components/DebtList';
import DebtForm from '../components/DebtForm';
import DebtStats from '../components/DebtStats';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function Debts() {
    const { debts, loading } = useDebt();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedType, setSelectedType] = useState('borrowed');

    const borrowedDebts = debts?.filter(d => d.type === 'borrowed') || [];
    const lentDebts = debts?.filter(d => d.type === 'lent') || [];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Debt Management</h1>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Record
                </button>
            </div>

            <DebtStats debts={debts || []} />

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <TabGroup onChange={(index) => setSelectedType(index === 0 ? 'borrowed' : 'lent')}>
                    <TabList className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
                        <Tab
                            className={({ selected }) =>
                                classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                    'focus:outline-none',
                                    selected
                                        ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-100 shadow'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-white'
                                )
                            }
                        >
                            Borrowed (Payable)
                        </Tab>
                        <Tab
                            className={({ selected }) =>
                                classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                    'focus:outline-none',
                                    selected
                                        ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-100 shadow'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-white'
                                )
                            }
                        >
                            Lent (Receivable)
                        </Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <DebtList debts={borrowedDebts} type="borrowed" />
                        </TabPanel>
                        <TabPanel>
                            <DebtList debts={lentDebts} type="lent" />
                        </TabPanel>
                    </TabPanels>
                </TabGroup>
            </div>

            <DebtForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                type={selectedType}
            />
        </div>
    );
}
