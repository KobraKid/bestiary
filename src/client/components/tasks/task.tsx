import React, { PropsWithChildren, useEffect, useState } from "react";

import "../../styles/task.scss";

export enum TaskState {
    NO_TASK,
    LOADING,
    COMPLETE,
    FAILED
}

interface ITaskProps {
    /** 
     * Whether the task has a setup step.
     * If so, the screen will be blocked even if no task has started yet.
     */
    hasPreTaskSetup?: boolean,
    /** Called if the task completes successfully. */
    onComplete?: () => void,
    /** Called if the task fails. */
    onFailed?: () => void
}

export const Task: React.FC<PropsWithChildren<ITaskProps>> = (props: PropsWithChildren<ITaskProps>) => {
    const { hasPreTaskSetup, onComplete, onFailed } = props;

    const [state, setTaskState] = useState<TaskState>(TaskState.NO_TASK);
    const [taskMessage, setTaskMessage] = useState<string>("");
    const [pctComplete, setPctComplete] = useState<number>(0);
    const [totalPctCompletion, setTotalPctCompletion] = useState<number>(0);

    useEffect(() => {
        window.task.taskUpdate((update: string, pctComplete: number, totalPctCompletion: number) => {
            setTaskState(TaskState.LOADING);
            setTaskMessage(update);
            setPctComplete(pctComplete);
            setTotalPctCompletion(totalPctCompletion);
        });

        window.task.taskComplete(() => {
            setTaskState(TaskState.COMPLETE);
            onComplete && onComplete();
            setTimeout(() => {
                setTaskState(TaskState.NO_TASK);
                window.menu.actionComplete();
            }, 800);
        });

        window.task.taskFailed(() => {
            setTaskState(TaskState.FAILED);
            onFailed && onFailed();
            setTimeout(() => {
                setTaskState(TaskState.NO_TASK);
                window.menu.actionComplete();
            }, 800);
        });
    }, []);

    if (!hasPreTaskSetup && state === TaskState.NO_TASK) { return null; }
    return (
        <div className="task-mask">
            {props.children}
            {state === TaskState.LOADING &&
                <Loading taskMessage={taskMessage} pctComplete={pctComplete} totalPctCompletion={totalPctCompletion} />}
            {state === TaskState.COMPLETE &&
                <Complete />}
            {state === TaskState.FAILED &&
                <Failed />}
        </div>
    );
};

interface ILoadingProps {
    taskMessage: string,
    pctComplete: number,
    totalPctCompletion: number
}

const Loading: React.FC<ILoadingProps> = (props: ILoadingProps) => {
    const { taskMessage, pctComplete, totalPctCompletion } = props;
    return (
        <>
            <div className="task-loading" />
            <div className="task-message">{taskMessage}</div>
            <div className="task-percent">
                <div className="task-percent-label">
                    <div>{`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(pctComplete * 100)}%`}</div>
                </div>
                <div className="task-percent-inner" style={{ width: `${pctComplete * 100}%` }} />
            </div>
            <div className="task-percent">
                <div className="task-percent-label">
                    <div>{`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPctCompletion * 100)}%`}</div>
                </div>
                <div className="task-percent-inner" style={{ width: `${totalPctCompletion * 100}%` }} />
            </div>
        </>
    );
};

const Complete: React.FC = () => {
    return (
        <div className="task-loading-complete">
            <svg height="150" width="200">
                <path d="M180 0 L200 20 L70 150 L0 80 L20 60 L70 110 Z" stroke="#00CC00" fill="#00CC00" />
            </svg>
        </div>
    );
};

const Failed: React.FC = () => {
    return (
        <div className="task-loading-failed">
            <svg height="200" width="200">
                <path d="M0 20 L20 0 L100 80 L180 0 L200 20 L120 100 L200 180 L180 200 L100 120 L20 200 L0 180 L80 100 Z" stroke="#CC0000" fill="#CC0000" />
            </svg>
        </div>
    );
};