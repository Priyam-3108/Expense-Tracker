import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 glass-modal-backdrop" />
        </Transition.Child>

        {/* This wrapper forces content to align bottom on mobile, center on desktop */}
        <div className="fixed inset-0 flex flex-col justify-end md:justify-center md:items-center md:p-4">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="translate-y-full md:opacity-0 md:translate-y-4 md:scale-95"
            enterTo="translate-y-0 md:opacity-100 md:scale-100"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-y-0 md:opacity-100 md:scale-100"
            leaveTo="translate-y-full md:opacity-0 md:translate-y-4 md:scale-95"
          >
            <Dialog.Panel
              className={`w-full ${maxWidth} transform overflow-hidden rounded-t-2xl md:rounded-2xl transition-all flex flex-col glass-modal-panel`}
              style={{ maxHeight: '90vh' }}
            >
              <div className="flex flex-col h-full">
                {title && (
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.08] px-6 py-4 flex-shrink-0">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-xl p-2 text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-500 dark:hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-200"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {/* The content wrapper controls the inner scrolling */}
                <div className="flex-1 overflow-y-auto w-full">
                  {children}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
