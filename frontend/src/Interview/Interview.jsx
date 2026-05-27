import React, { useEffect, useRef, useState } from 'react';
import { UserRound, Mic, MicOff, Video, VideoOff, PhoneOff, Sparkles } from 'lucide-react';

const Interview = ({ interviewData, onSessionChange }) => {
  const initialInterviewComplete = Boolean(interviewData?.interviewComplete);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(interviewData?.currentQuestion || '');
  const [progress, setProgress] = useState(interviewData?.progress || { current: 1, total: 1 });
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [latestFeedback, setLatestFeedback] = useState(interviewData?.latestFeedback || null);
  const [finalSummary, setFinalSummary] = useState(interviewData?.finalSummary || '');
  const [overallScore, setOverallScore] = useState(interviewData?.overallScore ?? null);
  const [interviewComplete, setInterviewComplete] = useState(initialInterviewComplete);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEndingInterview, setIsEndingInterview] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    initialInterviewComplete
      ? 'Interview completed. Review your score and summary below.'
      : interviewData?.currentQuestion
        ? 'Your saved interview session is ready.'
        : 'Your interviewer is ready.'
  );

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const shouldSubmitRecordingRef = useRef(true);

  useEffect(() => {
    if (interviewData?.audioURL) {
      const introAudio = new Audio(interviewData.audioURL);
      introAudio.play().catch(() => {});
    }
  }, [interviewData]);

  const startRecording = async () => {
    if (interviewComplete || isSubmitting) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      shouldSubmitRecordingRef.current = true;
      setStatusMessage('Listening to your answer...');

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (!shouldSubmitRecordingRef.current) {
          shouldSubmitRecordingRef.current = true;
          audioChunksRef.current = [];
          setIsSubmitting(false);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsSubmitting(true);
        setStatusMessage('Reviewing your answer...');

        try {
          const formData = new FormData();
          formData.append('sessionId', interviewData.sessionId);
          formData.append('audio', audioBlob, 'answer.webm');

          const response = await fetch('http://localhost:3000/api/interview/submit-answer', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to submit answer');
          }

          setTranscript(data.transcript || '');
          setAiResponse(data.aiResponse || '');
          setLatestFeedback(data.latestFeedback || null);
          setCurrentQuestion(data.currentQuestion || '');
          setProgress(data.progress || progress);
          setInterviewComplete(Boolean(data.interviewComplete));
          setFinalSummary(data.finalSummary || '');
          setOverallScore(data.overallScore ?? null);
          onSessionChange?.({
            ...interviewData,
            ...data,
          });
          setStatusMessage(
            data.interviewComplete
              ? 'Interview completed. Review your summary below.'
              : data.moveToNext
                ? 'Nice progress. Ready for the next question.'
                : 'The interviewer wants a bit more detail.'
          );

          if (data.audioURL) {
            const questionAudio = new Audio(data.audioURL);
            questionAudio.play().catch(() => {});
          }
        } catch (error) {
          console.log('Error while receiving question', error);
          setStatusMessage('Something went wrong while processing your answer.');
        } finally {
          setIsSubmitting(false);
        }
      };

      mediaRecorder.start();
      setMicOn(true);
    } catch (error) {
      console.log('Microphone permission denied', error);
      setStatusMessage('Microphone access is needed to continue the interview.');
    }
  };

  const stopRecording = (shouldSubmit = true) => {
    if (!mediaRecorderRef.current) return;

    shouldSubmitRecordingRef.current = shouldSubmit;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    setMicOn(false);
  };

  const handleEndInterview = async () => {
    if (isSubmitting || isEndingInterview || interviewComplete) return;

    if (micOn) {
      stopRecording(false);
    }

    setIsEndingInterview(true);
    setStatusMessage('Ending interview and preparing your final score...');

    try {
      const response = await fetch('http://localhost:3000/api/interview/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: interviewData.sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to end interview');
      }

      setInterviewComplete(true);
      setCurrentQuestion('');
      setProgress(data.progress || progress);
      setFinalSummary(data.finalSummary || '');
      setOverallScore(data.overallScore ?? null);
      onSessionChange?.({
        ...interviewData,
        ...data,
      });
      setStatusMessage('Interview completed. Review your score and summary below.');
    } catch (error) {
      console.log('Error while ending interview', error);
      setStatusMessage('Something went wrong while ending the interview.');
    } finally {
      setIsEndingInterview(false);
    }
  };

  const progressPercent = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-green-50 to-green-100 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-green-100 shadow-2xl p-10 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-green-200/30 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-emerald-100/40 blur-3xl rounded-full"></div>

          <div className="z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-8 w-fit">
            <Sparkles size={16} />
            Smart AI Interview Session
          </div>

          <div className="relative z-10 mx-auto">
            <div className="p-5 rounded-full border border-dashed border-green-300 bg-white/40">
              <div className="p-5 rounded-full border border-green-200 bg-green-50 shadow-xl">
                <div className="p-6 rounded-full bg-white shadow-inner">
                  <UserRound
                    size={180}
                    strokeWidth={1}
                    color="#8DD67F"
                    fill="#B7F0AE"
                    className="drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping opacity-20"></div>
          </div>

          <div className="z-10 text-center mt-8">
            <h1 className="text-4xl font-bold text-gray-800">AI Interviewer</h1>
            <p className="text-gray-500 mt-3 max-w-md mx-auto">
              {statusMessage}
            </p>
          </div>

          <div className="z-10 mt-8 rounded-3xl border border-emerald-100 bg-white/75 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
              <span>Interview progress</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-800">
              Current question
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {currentQuestion || 'Interview completed.'}
            </p>
          </div>

          <div className="z-10 mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
              <p className="text-sm font-semibold text-slate-800">Your last transcript</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {transcript || 'Your spoken answer will appear here after submission.'}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
              <p className="text-sm font-semibold text-slate-800">Interviewer reply</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {aiResponse || 'The interviewer response will appear here.'}
              </p>
            </div>
          </div>

          {latestFeedback && (
            <div className="z-10 mt-6 rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 text-sm text-emerald-950">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold">Answer feedback</p>
                <p>Score {latestFeedback.score} · Confidence {latestFeedback.confidence}</p>
              </div>
              <p className="mt-3 leading-6">{latestFeedback.feedback}</p>
              {latestFeedback.strengths?.length > 0 && (
                <p className="mt-3 leading-6">
                  Strong points: {latestFeedback.strengths.join(' • ')}
                </p>
              )}
              {latestFeedback.improvements?.length > 0 && (
                <p className="mt-2 leading-6">
                  Improve next: {latestFeedback.improvements.join(' • ')}
                </p>
              )}
            </div>
          )}

          {finalSummary && (
            <div className="z-10 mt-6 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-sm text-white">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold">Final interview summary</p>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Overall score</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{overallScore ?? 0}/100</p>
                </div>
              </div>
              <p className="mt-3 leading-6 text-slate-200">{finalSummary}</p>
            </div>
          )}
        </div>

        <div className="bg-black rounded-[2rem] overflow-hidden relative shadow-2xl min-h-[700px] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black"></div>

          <div className="z-10 text-center px-8">
            <div className="w-32 h-32 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto backdrop-blur-md">
              <UserRound size={70} color="#9BE28F" />
            </div>
            <h2 className="text-white text-2xl font-semibold mt-5">Candidate Camera</h2>
            <p className="text-gray-400 mt-2">
              {isSubmitting ? 'Processing your answer...' : micOn ? 'Recording in progress' : 'Tap the mic and answer naturally than turn it off after recording!'}
            </p>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-5 bg-white/10 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-2xl">
            <button
              onClick={() => {
                if (micOn) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              disabled={isSubmitting || interviewComplete}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 ${
                micOn ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {micOn ? <Mic className="text-white" /> : <MicOff className="text-white" />}
            </button>

            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                cameraOn ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {cameraOn ? <Video className="text-white" /> : <VideoOff className="text-white" />}
            </button>

            <button
              type="button"
              onClick={handleEndInterview}
              disabled={isSubmitting || isEndingInterview || interviewComplete}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all duration-300 shadow-lg shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PhoneOff className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
