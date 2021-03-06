import {range, shuffle, getOS, getBrowser, createCode} from './utils.js';


export class ExperimentParameters {
    /***

     Experiment initializer
     All the parameters for
     the experiment are defined here
     ***/

    constructor({
                    online,
                    isTesting,
                    completeFeedback,
                    maxPoints,
                    expName,
                    beforeFeedbackDuration,
                    feedbackDuration,
                    maxTrainingNum,
                    compLink,
                    imgPath,
                    maxCompensation,
                    nTrialPerCondition,
                    nTrialPerConditionTraining,
                    nCond,
                    nSession
                } = {}) {

        // Initial Experiment Parameters
        // ===================================================================== // 
        this.online = online;
        this.completeFeedback = completeFeedback;
        this.expName = expName;
        this.isTesting = isTesting;

        this.feedbackDuration = feedbackDuration;
        this.beforeFeedbackDuration = beforeFeedbackDuration;

        this.nSession = nSession;

        this.sumReward = [0, 0, 0, 0, 0, 0, 0];

        this.totalReward = 0;

        this.maxTrainingNum = maxTrainingNum;

        this.initTime = (new Date()).getTime();

        this.expID = createCode();

        this.browsInfo = getOS() + ' - ' + getBrowser();

        this.subID = undefined;

        this.compLink = compLink;


        // initGameStageDiv
        this._initContingencies();
        this._loadImg(imgPath, nCond, nSession);
        this._initConditionArrays(
            nTrialPerCondition, nTrialPerConditionTraining, nCond, nSession);
        this._initTrialObj(nCond, nSession);

        if (maxPoints) {
            this.maxPoints = maxPoints;
        } else {
            this.maxPoints = this._computeMaxPoints(nSession);
        }

        // define compensation functions
        // ===================================================================== //
        this.conversionRate = (maxCompensation / this.maxPoints).toFixed(2);
        this.pointsToPence = points => points * this.conversionRate;
        this.penceToPounds = pence => pence / 100;
        this.pointsToPounds = points => this.penceToPounds(this.pointsToPence(points));

    }

    _initContingencies() {
        this.cont = [];
        this.probs = [];
        this.rewards = [];
        this.ev = [];
        this.rew = undefined;

        // Define all possible probabilities and rewards
        // structure is [lose, win]
        // ===================================================================== //
        this.cont[0] = [1., 0.];        // -1
        this.cont[1] = [0.9, 0.1];      // -.8
        this.cont[2] = [0.8, 0.2];      // -.6
        this.cont[3] = [0.7, 0.3];      // X
        this.cont[4] = [0.6, 0.4];// .8 X
        this.cont[5] = [0.5, 0.5];// .8
        this.cont[6] = [0.4, 0.6];// .8 X
        this.cont[7] = [0.3, 0.7];// .8 X
        this.cont[8] = [0.2, 0.8];// .8
        this.cont[9] = [0.1, 0.9];// .8
        this.cont[10] = [0., 1.];// .8
        this.cont[11] = [.85, .15];// -.7
        this.cont[12] = [.75, .25];// -.5
        this.cont[13] = [.65, .35];// -.3 X
        this.cont[14] = [.55, .45];// -.1
        this.cont[15] = [.45, .55];// .1
        this.cont[16] = [.35, .65];// .3 X
        this.cont[17] = [.25, .75];// .5
        this.cont[18] = [.15, .85];// .7


        // only magnitudes in the experiment
        this.rew = [-1, 1];

        // compute ev for each cont
        for (let i = 0; i < this.cont.length; i++) {
            this.ev[i] = math.round(
                math.multiply(this.rew, this.cont[i]), 2);
        }

        this.lotteryCont = [];
        this.selectedCont = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let i = 0;
        for (let cont in this.cont) {
            if (this.selectedCont.includes(i)) {
                this.lotteryCont.push(cont);
            }
            i++;
        }

        // Define Learning using rew and cont idx
        // structure is [option 1, option 2]
        // option 1 is always the best here
        // ===================================================================== //
        this.rewards[0] = [this.rew, this.rew];
        this.probs[0] = [9, 1];

        this.rewards[1] = [this.rew, this.rew];
        this.probs[1] = [6, 4];

        // this.rewards[2] = [this.rew, this.rew];
        // this.probs[2] = [8, 2];
        //
        // this.rewards[3] = [this.rew, this.rew];
        // this.probs[3] = [17, 12];

    }

    _initConditionArrays(nTrialPerCondition, nTrialPerConditionTraining, nCond, nSession) {

        // Define conditions
        // ===================================================================== //
        this.expCondition = new Array(nSession).fill().map(x => []);
        this.trainingCondition = new Array(nSession).fill().map(x => []);

        // EXP
        // ===================================================================== //
        // shuffle the options to randomize context content
        this.learningOptions = shuffle(this.learningOptions);
        this.contexts = new Array(nSession).fill().map(x => []);
        // Same for training
        this.trainingOptions = shuffle(this.trainingOptions);
        this.trainingContexts = new Array(nSession).fill().map(x => []);

        // range cond for each session
        let cond = shuffle(range(0, nCond - 1));

        let learningOptionIdx = 0;
        let trainingOptionIdx = 0;

        // Create condition arrays
        // ===================================================================== //
        for (let sessionNum = 0; sessionNum < nSession; sessionNum++) {
            let learningOptionIdx = 0;
            let trainingOptionIdx = 0;
            // learning condition
            for (let i = 0; i < cond.length; i++) {
                this.expCondition[sessionNum].push(
                    Array(nTrialPerCondition).fill(cond[i]).flat()
                );
            }
            this.expCondition[sessionNum] = this.expCondition[sessionNum].flat();

            // training conditions
            for (let i = 0; i < cond.length; i++) {
                this.trainingCondition[sessionNum].push(
                    Array(nTrialPerConditionTraining).fill(cond[i]).flat()
                );
            }
            this.trainingCondition[sessionNum] = this.trainingCondition[sessionNum].flat();

            // learning contexts
            for (let i = 0; i < nCond * 2; i += 2) {
                this.contexts[sessionNum].push([
                    this.learningOptions[learningOptionIdx], this.learningOptions[learningOptionIdx + 1]
                ]);
                learningOptionIdx += 2;
            }

            // training contexts
            for (let i = 0; i < nCond * 2; i += 2) {
                this.trainingContexts[sessionNum].push([
                    this.trainingOptions[trainingOptionIdx], this.trainingOptions[trainingOptionIdx + 1]
                ]);
                trainingOptionIdx += 2;
            }

            this.trainingContexts[sessionNum] = shuffle(this.trainingContexts[sessionNum]);

        }
        // ===================================================================== //
    }

    _initTrialObj(nCond, nSession) {

        // define catch trials
        // ===================================================================== //
        // ===================================================================== //
        // using cont idx
        let catchTrialsTemp = shuffle([
            [9, 1],
            [8, 1],
            [7, 1],
            [6, 1],
            [9, 2],
            [8, 2],
            [7, 2],
            [9, 3],
            [8, 3],
            [7, 3],
        ]);

        let catchTrials = [];
        for (let i = 0; i < catchTrialsTemp.length; i++) {

            let contIdx1 = catchTrialsTemp[i][0];
            let contIdx2 = catchTrialsTemp[i][1];

            let ev1 = this.ev[contIdx1];
            let ev2 = this.ev[contIdx2];

            let file1 = ev1.toString();
            let file2 = ev2.toString();

            let p1 = this.cont[contIdx1];
            let p2 = this.cont[contIdx2];

            let r1 = this.rew;
            let r2 = this.rew;

            let isCatchTrial = true;

            let option1Type = 0;
            let option2Type = 0;

            catchTrials[i] = [
                file1, file2, contIdx1, contIdx2,
                p1, p2, ev1, ev2, r1, r2, isCatchTrial, option1Type, option2Type
            ];
        }

        // define ambiguity vs lottery trials
        // ===================================================================== //
        // ===================================================================== //
        // using cont idx
        let lotVSAmbiguity = [];
        for (let k = 0; k < 2; k++) {
            for (let j = 0; j < this.selectedCont.length; j++) {

                let idx = this.selectedCont[j];

                let contIdx1 = idx;
                let contIdx2 = idx;

                let ev1 = this.ev[contIdx1];
                let ev2 = this.ev[contIdx2];

                let file1 = ev1.toString();
                let file2 = '?';

                let p1 = this.cont[contIdx1];
                let p2 = this.cont[contIdx2];

                let r1 = this.rew;
                let r2 = this.rew;

                let isCatchTrial = false;

                let option1Type = 0;
                let option2Type = 2;

                lotVSAmbiguity.push([
                    file1, file2, contIdx1, contIdx2,
                    p1, p2, ev1, ev2, r1, r2, isCatchTrial, option1Type, option2Type
                ]);
            }
        }

        lotVSAmbiguity = shuffle(lotVSAmbiguity);

        // ===================================================================== //
        this.trialObjLearning = new Array(nSession).fill().map(x => []);
        this.trialObjSliderElicitation = new Array(nSession).fill().map(x => []);
        this.trialObjChoiceElicitation = new Array(nSession).fill().map(x => []);

        // Training
        this.trialObjSliderElicitationTraining = new Array(nSession).fill().map(x => []);
        this.trialObjChoiceElicitationTraining = new Array(nSession).fill().map(x => []);
        this.trialObjLearningTraining = new Array(nSession).fill().map(x => []);

        // Learning Phase -- Trial obj definition
        // ===================================================================== //
        // ===================================================================== //

        for (let sessionNum = 0; sessionNum < nSession; sessionNum++) {

            for (let i = 0; i < this.expCondition[sessionNum].length; i++) {

                let idx = this.expCondition[sessionNum][i];

                let contIdx1 = this.probs[idx][0];
                let contIdx2 = this.probs[idx][1];

                let [file1, file2] = this.contexts[sessionNum][idx];

                let ev1 = this.ev[contIdx1];
                let ev2 = this.ev[contIdx2];

                let p1 = this.cont[contIdx1];
                let p2 = this.cont[contIdx2];

                let r1 = this.rew;
                let r2 = this.rew;

                let isCatchTrial = false;

                let option1Type = 1;
                let option2Type = 1;

                this.trialObjLearning[sessionNum].push(
                    [file1, file2, contIdx1, contIdx2, p1, p2, ev1, ev2, r1, r2, isCatchTrial, option1Type, option2Type]
                );

            }

            for (let i = 0; i < this.trainingCondition[sessionNum].length; i++) {

                let idx = this.trainingCondition[sessionNum][i];

                let contIdx1 = this.probs[idx][0];
                let contIdx2 = this.probs[idx][1];

                let [file1, file2] = this.trainingContexts[sessionNum][idx];

                let ev1 = this.ev[contIdx1];
                let ev2 = this.ev[contIdx2];

                let p1 = this.cont[contIdx1];
                let p2 = this.cont[contIdx2];

                let r1 = this.rew;
                let r2 = this.rew;

                let isCatchTrial = false;

                let option1Type = 1;
                let option2Type = 1;

                this.trialObjLearningTraining[sessionNum].push(
                    [file1, file2, contIdx1, contIdx2, p1, p2, ev1, ev2, r1, r2, isCatchTrial, option1Type, option2Type]
                );

            }

            // Elicitation Phase -- Description experience + slider trial obj definition
            // ===================================================================== //
            // ===================================================================== //


            let catchTrialIdx = 0;

            // Training
            // ===================================================================== //
            for (let i = 0; i < nCond; i++) {

                let [file1, file2] = this.trainingContexts[sessionNum][i];

                let contIdx1 = this.probs[i][0];
                let contIdx2 = this.probs[i][1];

                let ev1 = this.ev[contIdx1];
                let ev2 = this.ev[contIdx2];

                let p1 = this.cont[contIdx1];
                let p2 = this.cont[contIdx2];

                let r1 = this.rew;
                let r2 = this.rew;

                let isCatchTrial = false;

                let option1Type = 1;

                this.trialObjSliderElicitationTraining[sessionNum].push(
                    [file1, contIdx1, p1, ev1, r1, isCatchTrial, option1Type]
                );

                // mix lotteries and stim 1
                let temp = [];

                for (let j = 0; j < this.selectedCont.length - 5; j++) {

                    let idx = this.selectedCont[j];
                    let lotteryFile = this.ev[idx].toString();
                    let lotteryContIdx = idx;
                    let lotteryEV = this.ev[idx];
                    let lotteryP = this.cont[idx];

                    let option1Type = 1;
                    let option2Type = 0;

                    temp.push([
                        file1, lotteryFile, contIdx1, lotteryContIdx, p1, lotteryP,
                        ev1, lotteryEV, r1, r2, isCatchTrial, option1Type, option2Type

                    ]);
                }

                // for (let k = 0; k < nCond; k++) {
                //     let [sym1, sym2] = this.trainingContexts[sessionNum][k];
                //
                //     let sym1contIdx = this.probs[k][0];
                //     let sym2contIdx = this.probs[k][1];
                //
                //     let symEv1 = this.ev[sym1contIdx];
                //     let symEv2 = this.ev[sym2contIdx];
                //
                //     let symP1 = this.cont[sym1contIdx];
                //     let symP2 = this.cont[sym2contIdx];
                //
                //     let symR1 = this.rew;
                //     let symR2 = this.rew;
                //
                //     let isCatchTrial = false;
                //
                //     let option1Type = 0;
                //     let option2Type = 0;
                //
                //     if (sym1 !== file1) {
                //         temp.push([
                //             file1, sym1,
                //             contIdx1, sym1contIdx,
                //             p1, symP1,
                //             ev1, symEv1,
                //             r1, symR1,
                //             isCatchTrial,
                //             option1Type,
                //             option2Type
                //         ])
                //     }
                //     if (sym2 !== file1) {
                //         temp.push([
                //             file1, sym2,
                //             contIdx1, sym2contIdx,
                //             p1, symP2,
                //             ev1, symEv2,
                //             r1, symR2,
                //             isCatchTrial,
                //             option1Type,
                //             option2Type
                //         ])
                //     }
                // }

                this.trialObjChoiceElicitationTraining[sessionNum] =
                    this.trialObjChoiceElicitationTraining[sessionNum].concat(shuffle(temp));
                this.trialObjChoiceElicitationTraining[sessionNum].push(catchTrials[catchTrialIdx]);
                catchTrialIdx++;

                // mix lotteries and stim 2
                temp = [];
                for (let j = 0; j < this.selectedCont.length - 5; j++) {

                    let idx = this.selectedCont[j];
                    let lotteryFile = this.ev[idx].toString();
                    let lotteryContIdx = idx;
                    let lotteryEV = this.ev[idx];
                    let lotteryP = this.cont[idx];

                    let option1Type = 1;
                    let option2Type = 0;

                    temp.push([
                        file2, lotteryFile, contIdx2, lotteryContIdx, p2, lotteryP,
                        ev2, lotteryEV, r1, r2, isCatchTrial, option1Type, option2Type
                    ]);

                }


                // for (let k = 0; k < nCond; k++) {
                //     let [sym1, sym2] = this.trainingContexts[sessionNum][k];
                //
                //     let sym1contIdx = this.probs[k][0];
                //     let sym2contIdx = this.probs[k][1];
                //
                //     let symEv1 = this.ev[sym1contIdx];
                //     let symEv2 = this.ev[sym2contIdx];
                //
                //     let symP1 = this.cont[sym1contIdx];
                //     let symP2 = this.cont[sym2contIdx];
                //
                //     let symR1 = this.rew;
                //     let symR2 = this.rew;
                //
                //     let isCatchTrial = false;
                //
                //     let option1Type = 1;
                //     let option2Type = 1;
                //
                //     if (sym1 !== file2) {
                //         temp.push([
                //             file2, sym1,
                //             contIdx2, sym1contIdx,
                //             p2, symP1,
                //             ev2, symEv1,
                //             r2, symR1,
                //             isCatchTrial,
                //             option1Type,
                //             option2Type
                //         ])
                //     }
                //     if (sym2 !== file2) {
                //         temp.push([
                //             file2, sym2,
                //             contIdx2, sym2contIdx,
                //             p2, symP2,
                //             ev2, symEv2,
                //             r2, symR2,
                //             isCatchTrial,
                //             option1Type,
                //             option2Type
                //         ])
                //     }
                // }

                this.trialObjChoiceElicitationTraining[sessionNum] =
                    this.trialObjChoiceElicitationTraining[sessionNum].concat(shuffle(temp));
                this.trialObjChoiceElicitationTraining[sessionNum].push(catchTrials[catchTrialIdx]);
            }

            // add catch trials to slider
            this.trialObjSliderElicitationTraining[sessionNum].push(
                [this.ev[2].toString(), 2, this.cont[2], this.ev[2], this.rew, true]
            );
            this.trialObjSliderElicitationTraining[sessionNum].push(
                [this.ev[8].toString(), 8, this.cont[8], this.ev[8], this.rew, true]
            );

            this.trialObjSliderElicitationTraining[sessionNum] = shuffle(
                this.trialObjSliderElicitationTraining[sessionNum]);

            // Phase 2
            // ===================================================================== //

            catchTrialIdx = 0;
            let lotVSAmbiguityIdx = 0;

            for (let i = 0; i < nCond; i++) {

                let [file1, file2] = this.contexts[sessionNum][i];

                let contIdx1 = this.probs[i][0];
                let contIdx2 = this.probs[i][1];

                let ev1 = this.ev[contIdx1];
                let ev2 = this.ev[contIdx2];

                let p1 = this.cont[contIdx1];
                let p2 = this.cont[contIdx2];

                let r1 = this.rew;
                let r2 = this.rew;

                let isCatchTrial = false;

                let option1Type = 1;

                this.trialObjSliderElicitation[sessionNum].push(
                    [file1, contIdx1, p1, ev1, r1, isCatchTrial, option1Type]
                );

                this.trialObjSliderElicitation[sessionNum].push(
                    [file2, contIdx2, p2, ev2, r2, isCatchTrial, option1Type]
                );

                // mix lotteries and stim 1
                let temp = [];
                for (let j = 0; j < this.selectedCont.length; j++) {

                    let idx = this.selectedCont[j];
                    let lotteryFile = this.ev[idx].toString();
                    let lotteryContIdx = idx;
                    let lotteryEV = this.ev[idx];
                    let lotteryP = this.cont[idx];

                    // ambiguity is 2
                    let option1Type = 1;
                    let option2Type = 0;

                    temp.push([
                        file1, lotteryFile, contIdx1, lotteryContIdx, p1,
                        lotteryP, ev1, lotteryEV, r1, r2, isCatchTrial, option1Type, option2Type
                    ]);
                }

                // for (let k = 0; k < nCond; k++) {
                //     let [sym1, sym2] = this.contexts[sessionNum][k];
                //
                //     let sym1contIdx = this.probs[k][0];
                //     let sym2contIdx = this.probs[k][1];
                //
                //     let symEv1 = this.ev[sym1contIdx];
                //     let symEv2 = this.ev[sym2contIdx];
                //
                //     let symP1 = this.cont[sym1contIdx];
                //     let symP2 = this.cont[sym2contIdx];
                //
                //     let symR1 = this.rew;
                //     let symR2 = this.rew;
                //
                //
                //     let isCatchTrial = false;
                //
                //     let option1Type = 1;
                //     let option2Type = 1;
                //
                //     if (sym1 !== file1) {
                //         temp.push([
                //             file1, sym1,
                //             contIdx1, sym1contIdx,
                //             p1, symP1,
                //             ev1, symEv1,
                //             r1, symR1,
                //             isCatchTrial,
                //             option1Type,
                //             option2Type
                //         ])
                //     }
                //     if (sym2 !== file1) {
                //         temp.push([
                //             file1, sym2,
                //             contIdx1, sym2contIdx,
                //             p1, symP2,
                //             ev1, symEv2,
                //             r1, symR2,
                //             isCatchTrial,
                //             option1Type,
                //             option2Type
                //         ])
                //     }
                // }

                this.trialObjChoiceElicitation[sessionNum] =
                    this.trialObjChoiceElicitation[sessionNum].concat(shuffle(temp));
                this.trialObjChoiceElicitation[sessionNum].push(catchTrials[catchTrialIdx]);
                catchTrialIdx++;

                // mix lotteries and stim 2 + lottery and ambiguity
                temp = [];
                for (let j = 0; j < this.selectedCont.length; j++) {

                    let idx = this.selectedCont[j];
                    let lotteryFile = this.ev[idx].toString();
                    let lotteryContIdx = idx;
                    let lotteryEV = this.ev[idx];
                    let lotteryP = this.cont[idx];

                    let option1Type = 1;
                    let option2Type = 0;

                    temp.push([
                        file2, lotteryFile, contIdx2, lotteryContIdx, p2,
                        lotteryP, ev2, lotteryEV, r1, r2, isCatchTrial, option1Type, option2Type
                    ]);
                }

                // for (let k = 0; k < nCond; k++) {
                //     let [sym1, sym2] = this.contexts[sessionNum][k];
                //
                //     let sym1contIdx = this.probs[k][0];
                //     let sym2contIdx = this.probs[k][1];
                //
                //     let symEv1 = this.ev[sym1contIdx];
                //     let symEv2 = this.ev[sym2contIdx];
                //
                //     let symP1 = this.cont[sym1contIdx];
                //     let symP2 = this.cont[sym2contIdx];
                //
                //     let symR1 = this.rew;
                //     let symR2 = this.rew;
                //
                //     let option1Type = 1;
                //     let option2Type = 1;
                //
                //     if (sym1 !== file2) {
                //         temp.push([
                //             file2, sym1,
                //             contIdx2, sym1contIdx,
                //             p2, symP1,
                //             ev2, symEv1,
                //             r2, symR1,
                //             isCatchTrial,
                //             option1Type,
                //             option2Type
                //         ])
                //     }
                //     if (sym2 !== file2) {
                //         temp.push([
                //             file2, sym2,
                //             contIdx2, sym2contIdx,
                //             p2, symP2,
                //             ev2, symEv2,
                //             r2, symR2,
                //             isCatchTrial,
                //             option1Type,
                //             option2Type
                //         ])
                //     }
                // }

                this.trialObjChoiceElicitation[sessionNum] =
                    this.trialObjChoiceElicitation[sessionNum].concat(shuffle(temp));
                this.trialObjChoiceElicitation[sessionNum].push(catchTrials[catchTrialIdx]);
                lotVSAmbiguityIdx += 2;

            }
            // add catch trials to slider
            this.trialObjSliderElicitation[sessionNum].push(
                [this.ev[1].toString(), 1, this.cont[1], this.ev[1], this.rew, true]
            );
            this.trialObjSliderElicitation[sessionNum].push(
                [this.ev[9].toString(), 9, this.cont[9], this.ev[9], this.rew, true]
            );

            this.trialObjSliderElicitation[sessionNum] = shuffle(this.trialObjSliderElicitation[sessionNum]);
        }

        // let pcount = {};
        // for (let s = 0; s < 2; s++) {
        //    for (let i = 0; i < this.trialObjChoiceElicitation[s].length; i++) {
        //        try {
        //            let trialObj = this.trialObjChoiceElicitation[s][i];
        //
        //            let params = {
        //                stimIdx1: trialObj[0], // key in img dict
        //                stimIdx2: trialObj[1],
        //                contIdx1: trialObj[2],
        //                contIdx2: trialObj[3],
        //                p1: trialObj[4],
        //                p2: trialObj[5],
        //                ev1: trialObj[6],
        //                ev2: trialObj[7],
        //                r1: trialObj[8],
        //                r2: trialObj[9],
        //                isCatchTrial: trialObj[10],
        //                option1Type: trialObj[11],
        //                option2Type: trialObj[12]
        //            };
        //
        //            if ((params['option1Type'] === 0) && (params['option2Type'] === 2)) {
        //                if (!pcount[params['p1'][0]]) {
        //                    pcount[params['p1'][0]] = 0;
        //                }
        //                pcount[params['p1'][0]] += 1;
        //
        //            }
        //        } catch {
        //            ;
        //        }
        //    }
        // }
        //
        // debugger
    }

    _computeMaxPoints(nSession) {
        // using expected value compute what will be the final score
        // if the subject makes optimal choices
        // here we have one session so we compute it once

        let maxPoints = 0;

        for (let sessionNum = 0; sessionNum < nSession; sessionNum++) {
            for (let i = 0; i < this.trialObjLearning[sessionNum].length; i++) {

                let ev1 = this.trialObjLearning[sessionNum][i][6];
                let ev2 = this.trialObjLearning[sessionNum][i][7];

                maxPoints += Math.max(ev1, ev2)
            }

            for (let i = 0; i < this.trialObjChoiceElicitation[sessionNum].length; i++) {

                let ev1 = this.trialObjChoiceElicitation[sessionNum][i][6];
                let ev2 = this.trialObjChoiceElicitation[sessionNum][i][7];

                maxPoints += Math.max(ev1, ev2)
            }

            for (let i = 0; i < this.trialObjSliderElicitation[sessionNum].length; i++) {
                let ev1 = this.trialObjSliderElicitation[sessionNum][i][3];
                maxPoints += ev1;
            }
        }

        return Math.round(maxPoints)
    }

    _loadImg(imgPath, nCond, nSession) {

        // Get stims, feedbacks, resources
        let nImg = nCond * 2 * nSession;
        let nTrainingImg = nCond * 2 * nSession;
        let imgExt = 'gif';
        let borderColor = "transparent";

        this.images = [];
        this.learningOptions = [];
        for (let i = 2; i < nImg + 2; i++) {
            this.learningOptions.push(i);
            this.images[i] = new Image();
            this.images[i].src = imgPath + 'stim_old/' + i + '.' + imgExt;
            this.images[i].className = "img-responsive center-block";
            this.images[i].style.border = "5px solid " + borderColor;
            this.images[i].style.position = "relative";
            this.images[i].style.top = "0px";
        }

        let feedbackNames = ["empty", "0", "1", "-1", '-2', '2'];
        this.feedbackImg = [];
        for (let i = 0; i < feedbackNames.length; i++) {
            let fb = feedbackNames[i];
            this.feedbackImg[fb] = new Image();
            this.feedbackImg[fb].src = imgPath + 'fb/' + fb + '.' + imgExt;
            this.feedbackImg[fb].className = "img-responsive center-block";
            this.feedbackImg[fb].style.border = "5px solid " + borderColor;
            this.feedbackImg[fb].style.position = "relative";
            this.feedbackImg[fb].style.top = "0px";
        }

        // Training stims
        imgExt = 'jpg';
        this.trainingImg = [];
        this.trainingOptions = [];
        let letters = [null, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
            'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        for (let i = 2; i <= nTrainingImg + 1; i++) {
            let idx = letters[i];
            this.trainingOptions.push(idx);
            this.trainingImg[idx] = new Image();
            this.trainingImg[idx].src = imgPath + 'stim/' + idx + '.' + imgExt;
            this.trainingImg[idx].className = "img-responsive center-block";
            this.trainingImg[idx].style.border = "5px solid " + borderColor;
            this.trainingImg[idx].style.position = "relative";
            this.trainingImg[idx].style.top = "0px";
        }

        for (let i = 0; i < this.ev.length; i++) {
            let idx = this.ev[i].toString();
            this.images[idx] = new Image();
            this.images[idx].src = imgPath + 'lotteries/' + idx + '.png';
            this.images[idx].className = "img-responsive center-block";
            this.images[idx].style.border = "5px solid " + borderColor;
            this.images[idx].style.position = "relative";
            this.images[idx].style.top = "0px";
            this.trainingImg[idx] = new Image();
            this.trainingImg[idx].src = imgPath + 'lotteries/' + idx + '.png';
            this.trainingImg[idx].className = "img-responsive center-block";
            this.trainingImg[idx].style.border = "5px solid " + borderColor;
            this.trainingImg[idx].style.position = "relative";
            this.trainingImg[idx].style.top = "0px";
        }
        this.images['?'] = new Image();
        this.images['?'].src = imgPath + 'stim/question.jpg';
        this.images['?'].className = "img-responsive center-block";
        this.images['?'].style.border = "5px solid " + borderColor;
        this.images['?'].style.position = "relative";
        this.images['?'].style.top = "0px";
        this.trainingImg['?'] = new Image();
        this.trainingImg['?'].src = imgPath + 'stim/question.jpg';
        this.trainingImg['?'].className = "img-responsive center-block";
        this.trainingImg['?'].style.border = "5px solid " + borderColor;
        this.trainingImg['?'].style.position = "relative";
        this.trainingImg['?'].style.top = "0px";

    }

}


