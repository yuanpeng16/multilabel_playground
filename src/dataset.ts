/* Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import * as d3 from 'd3';
import {
  Generalization,
  SecondLabel
} from "./state";
/**
 * A two dimensional example: x and y coordinates with the label.
 */
export type Example2D = {
  x: number,
  y: number,
  label: number,
  label2?: number
};

type Point = {
  x: number,
  y: number
};

const INPUT_SCALE = 0.8;
const MARGIN = 0.5;

function onMarginCircleLabel(p: Point): boolean {
  let distance = dist(p, {x: 0, y: 0});
  let threshold = 5 * 0.5;
  return Math.abs(distance - threshold) < MARGIN;
}

function onMarginXORLabel(p: Point): boolean {
  return Math.min(Math.abs(p.x), Math.abs(p.y)) < MARGIN;
}

function onMarginTwoGaussLabel(p: Point): boolean {
  return Math.abs(p.x + p.y) < 0.7071 * MARGIN;
}

function onMarginVerticalLabel(p: Point): boolean {
  return Math.abs(p.y) < MARGIN;
}

function onMarginRandomLabel(p: Point): boolean {
  return false;
}

function onMarginSameLabel(p: Point): boolean {
  return false;
}

function onMargin(x: number, y: number, secondLabel: number): boolean {
  let result;
  if (secondLabel === SecondLabel.LINEAR) {
    result = onMarginTwoGaussLabel({x: x, y: y});
  } else if (secondLabel === SecondLabel.CIRCLE) {
    result = onMarginCircleLabel({x: x, y: y});
  } else if (secondLabel === SecondLabel.XOR) {
    result = onMarginXORLabel({x: x, y: y});
  } else if (secondLabel === SecondLabel.VERTICAL) {
    result = onMarginVerticalLabel({x: x, y: y});
  } else if (secondLabel === SecondLabel.RANDOM) {
    result = onMarginRandomLabel({x: x, y: y});
  } else {
    result = onMarginSameLabel({x: x, y: y});
  }
  return result;
}

export function filterByMargin(data: Example2D[], secondLabel:number): Example2D[] {
  let points: Example2D[] = [];
  for (let i = 0; i < data.length; i++) {
    let point = data[i];
    let invalid = onMargin(point.x, point.y, secondLabel);
    if (!invalid) {
      points.push(point);
    }
  }
  return points;
}

function getCircleLabel(p: Point): number {
  return (dist(p, {x: 0, y: 0}) < (5 * 0.5)) ? 1 : -1;
}

function getXORLabel(p: Point): number {
  return p.x * p.y >= 0 ? 1 : -1;
}

function getTwoGaussLabel(p: Point): number {
  return p.x + p.y >= 0 ? 1 : -1;
}

function getVerticalLabel(p: Point): number {
  return p.y >= 0 ? 1 : -1;
}

function getRandomLabel(p: Point): number {
  return Math.random() * 2 >= 1 ? 1 : -1;
}

function getSameLabel(label: number): number {
  return label;
}

function getLabel2(x: number, y: number, secondLabel: number, label: number): number {
  let label2;
  if (secondLabel === SecondLabel.LINEAR) {
    label2 = getTwoGaussLabel({x: x, y: y});
  } else if (secondLabel === SecondLabel.CIRCLE) {
    label2 = getCircleLabel({x: x, y: y});
  } else if (secondLabel === SecondLabel.XOR) {
    label2 = getXORLabel({x: x, y: y});
  } else if (secondLabel === SecondLabel.VERTICAL) {
    label2 = getVerticalLabel({x: x, y: y});
  } else if (secondLabel === SecondLabel.RANDOM) {
    label2 = getRandomLabel({x: x, y: y});
  } else {
    label2 = getSameLabel(label);
  }
  return label2;
}

export function addLabels(data: Example2D[], secondLabel:number): void {
  for (let i = 0; i < data.length; i++) {
    let point = data[i];
    let label2 = getLabel2(point.x, point.y, secondLabel, point.label);
    point.label2 = label2;
    point.x = INPUT_SCALE * point.x
    point.y = INPUT_SCALE * point.y
  }
}

function filterByLabel(label1: number, label2: number, id:number): boolean {
  let p1 = label1 > 0;
  let p2 = label2 > 0;
  if (id === Generalization.OOD_PP) {
    return p1 && p2;
  } else if (id === Generalization.OOD_PN) {
    return p1 && !p2;
  } else if (id === Generalization.OOD_NP) {
    return !p1 && p2;
  } else if (id === Generalization.OOD_NN) {
    return !p1 && !p2;
  }
  return false;
}

function getIndex(length: number, perc: number): number {
  return Math.floor(length * perc / 100)
}

function filterData(data: Example2D[], id: number, isTrain: boolean): Example2D[] {
  let points: Example2D[] = [];
  for (let i = 0; i < data.length; i++) {
    let point = data[i];
    let filters = filterByLabel(point.label, point.label2, id);
    if (isTrain && !filters || !isTrain && filters) {
      points.push(point);
    }
  }
  return points
}

export function splitData(data: Example2D[], percTrainData:number, id: number): Example2D[][] {
  let splitIndex = getIndex(data.length, percTrainData);
  let trainData: Example2D[] = data.slice(0, splitIndex);
  let testData: Example2D[] = data.slice(splitIndex);
  if (id !== Generalization.IID) {
    trainData = filterData(trainData, id, true)
    testData = filterData(testData, id, false)
  }
  return [trainData, testData];
}

/**
 * Shuffles the array using Fisher-Yates algorithm. Uses the seedrandom
 * library as the random generator.
 */
export function shuffle(array: any[]): void {
  let counter = array.length;
  let temp = 0;
  let index = 0;
  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    index = Math.floor(Math.random() * counter);
    // Decrease counter by 1
    counter--;
    // And swap the last element with it
    temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }
}

export type DataGenerator = (numSamples: number, noise: number) => Example2D[];

function getGauss(numSamples: number, noise: number, centers: number[][]):
    Example2D[] {
  let points: Example2D[] = [];

  let varianceScale = d3.scale.linear().domain([0, .5]).range([0.5, 4]);
  let variance = varianceScale(noise);

  function genGauss(cx: number, cy: number, label: number) {
    for (let i = 0; i < numSamples / 2; i++) {
      let x = normalRandom(cx, variance);
      let y = normalRandom(cy, variance);
      points.push({x, y, label});
    }
  }
  for (let i = 0; i < centers.length; i++) {
    let c = centers[i];
    genGauss(c[0], c[1], c[2]);
  }
  return points
}

export function classifyTwoGaussData(numSamples: number, noise: number):
    Example2D[] {
  let centers = [
    [2, 2, 1], // Gaussian with positive examples.
    [-2, -2, -1]]; // Gaussian with negative examples.
  return getGauss(numSamples, noise, centers);
}

export function classifyHorizontalData(numSamples: number, noise: number):
    Example2D[] {
  let centers = [
    [3, 3, 1], // Gaussian with positive examples.
    [3, -3, 1],
    [-3, 3, -1],
    [-3, -3,-1]]; // Gaussian with negative examples.
  return getGauss(numSamples, 0.5 * noise, centers);
}

export function classifyRandomData(numSamples: number, noise: number):
    Example2D[] {
  numSamples = Math.floor(numSamples / 8);
  let points: Example2D[] = [];
  for (let i = 0; i < numSamples; i++) {
    let x = randUniform(-5, 5);
    let y = randUniform(-5, 5);
    let noiseX = randUniform(-5, 5) * noise;
    let noiseY = randUniform(-5, 5) * noise;
    let label = getRandomLabel({x: x + noiseX, y: y + noiseY});
    points.push({x, y, label});
  }
  return points;
}

export function regressPlane(numSamples: number, noise: number):
  Example2D[] {
  let radius = 6;
  let labelScale = d3.scale.linear()
    .domain([-10, 10])
    .range([-1, 1]);
  let getLabel = (x, y) => labelScale(x + y);

  let points: Example2D[] = [];
  for (let i = 0; i < numSamples; i++) {
    let x = randUniform(-radius, radius);
    let y = randUniform(-radius, radius);
    let noiseX = randUniform(-radius, radius) * noise;
    let noiseY = randUniform(-radius, radius) * noise;
    let label = getLabel(x + noiseX, y + noiseY);
    points.push({x, y, label});
  }
  return points;
}

export function regressGaussian(numSamples: number, noise: number):
  Example2D[] {
  let points: Example2D[] = [];

  let labelScale = d3.scale.linear()
    .domain([0, 2])
    .range([1, 0])
    .clamp(true);

  let gaussians = [
    [-4, 2.5, 1],
    [0, 2.5, -1],
    [4, 2.5, 1],
    [-4, -2.5, -1],
    [0, -2.5, 1],
    [4, -2.5, -1]
  ];

  function getLabel(x, y) {
    // Choose the one that is maximum in abs value.
    let label = 0;
    gaussians.forEach(([cx, cy, sign]) => {
      let newLabel = sign * labelScale(dist({x, y}, {x: cx, y: cy}));
      if (Math.abs(newLabel) > Math.abs(label)) {
        label = newLabel;
      }
    });
    return label;
  }
  let radius = 6;
  for (let i = 0; i < numSamples; i++) {
    let x = randUniform(-radius, radius);
    let y = randUniform(-radius, radius);
    let noiseX = randUniform(-radius, radius) * noise;
    let noiseY = randUniform(-radius, radius) * noise;
    let label = getLabel(x + noiseX, y + noiseY);
    points.push({x, y, label});
  };
  return points;
}

export function classifySpiralData(numSamples: number, noise: number):
    Example2D[] {
  let points: Example2D[] = [];
  let n = numSamples / 2;

  function genSpiral(deltaT: number, label: number) {
    for (let i = 0; i < n; i++) {
      let r = i / n * 5;
      let t = 1.75 * i / n * 2 * Math.PI + deltaT;
      let x = r * Math.sin(t) + randUniform(-1, 1) * noise;
      let y = r * Math.cos(t) + randUniform(-1, 1) * noise;
      points.push({x, y, label});
    }
  }

  genSpiral(0, 1); // Positive examples.
  genSpiral(Math.PI, -1); // Negative examples.
  return points;
}

export function classifyCircleData(numSamples: number, noise: number):
    Example2D[] {
  let points: Example2D[] = [];
  let radius = 5;
  function getCircleLabel(p: Point, center: Point) {
    return (dist(p, center) < (radius * 0.5)) ? 1 : -1;
  }

  // Generate positive points inside the circle.
  for (let i = 0; i < numSamples / 2; i++) {
    let r = randUniform(0, radius * 0.5);
    let angle = randUniform(0, 2 * Math.PI);
    let x = r * Math.sin(angle);
    let y = r * Math.cos(angle);
    let noiseX = randUniform(-radius, radius) * noise;
    let noiseY = randUniform(-radius, radius) * noise;
    let label = getCircleLabel({x: x + noiseX, y: y + noiseY}, {x: 0, y: 0});
    points.push({x, y, label});
  }

  // Generate negative points outside the circle.
  for (let i = 0; i < numSamples / 2; i++) {
    let r = randUniform(radius * 0.7, radius);
    let angle = randUniform(0, 2 * Math.PI);
    let x = r * Math.sin(angle);
    let y = r * Math.cos(angle);
    let noiseX = randUniform(-radius, radius) * noise;
    let noiseY = randUniform(-radius, radius) * noise;
    let label = getCircleLabel({x: x + noiseX, y: y + noiseY}, {x: 0, y: 0});
    points.push({x, y, label});
  }
  return points;
}

export function classifyXORData(numSamples: number, noise: number):
    Example2D[] {
  function getXORLabel(p: Point) { return p.x * p.y >= 0 ? 1 : -1; }

  let points: Example2D[] = [];
  for (let i = 0; i < numSamples; i++) {
    let x = randUniform(-5, 5);
    let padding = 0.3;
    x += x > 0 ? padding : -padding;  // Padding.
    let y = randUniform(-5, 5);
    y += y > 0 ? padding : -padding;
    let noiseX = randUniform(-5, 5) * noise;
    let noiseY = randUniform(-5, 5) * noise;
    let label = getXORLabel({x: x + noiseX, y: y + noiseY});
    points.push({x, y, label});
  }
  return points;
}

/**
 * Returns a sample from a uniform [a, b] distribution.
 * Uses the seedrandom library as the random generator.
 */
function randUniform(a: number, b: number) {
  return Math.random() * (b - a) + a;
}

/**
 * Samples from a normal distribution. Uses the seedrandom library as the
 * random generator.
 *
 * @param mean The mean. Default is 0.
 * @param variance The variance. Default is 1.
 */
function normalRandom(mean = 0, variance = 1): number {
  let v1: number, v2: number, s: number;
  do {
    v1 = 2 * Math.random() - 1;
    v2 = 2 * Math.random() - 1;
    s = v1 * v1 + v2 * v2;
  } while (s > 1);

  let result = Math.sqrt(-2 * Math.log(s) / s) * v1;
  return mean + Math.sqrt(variance) * result;
}

/** Returns the eucledian distance between two points in space. */
function dist(a: Point, b: Point): number {
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
