# Deep multi-label playground

This repository extends the Deep playground by using multiple output labels.

https://github.com/tensorflow/playground

It is an interactive visualization of neural networks, written in
TypeScript using d3.js.

## Development

To run the visualization locally, run:
- `npm i` to install dependencies
- `npm run build` to compile the app and place it in the `dist/` directory
- `npm run serve` to serve from the `dist/` directory and open a page on your browser.

For a fast edit-refresh cycle when developing run `npm run serve-watch`.
This will start an http server and automatically re-compile the TypeScript,
HTML and CSS files whenever they change.

## Extended user interface
### Loss function
- Square: from the original version.
- Cross entropy: equivalent to logistic loss for binary classification.
- Hinge: max margin.

### Optimizer
- SGD: from the original version.
- AdaGrad
- RMSProp
- Adam

### Generalization
Test data distribution comparing with the training one.
- IID: independently drawn form the identical distribution as the training distribution.
- OOD ++: out of training distribution; first output is positive and second is positive.
- OOD +-: out of training distribution; first output is positive and second is negative.
- OOD -+: out of training distribution; first output is negative and second is negative.
- OOD ++: out of training distribution; first output is negative and second is negative.

### Second label
Ground-truth label of the second output.
- Linear: `X1 + X2 >= 0`
- Circle: `X1 * X1 + X2 * X2 < 6.25`
- Xor: `X1 * X2 >= 0`
- Vertical: `X2 >= 0`
- Random
- Same: the same as the first label

### More datasets
- Horizontal: four Gaussian distributions with horizontal directions for labels.
- Random: Uniformly random distribution with random labels.

### Larger network architecture
The maximum number of hidden layers is extended to 16.
The maximum number of neurons in each hidden layers is extended to 128.
The add or remove button changes the number of neuron exponentially when it is 8 or more.
At most 10 neurons are displayed for each hidden layer.
On start-up, the network has two hidden layers, each with 8 hidden neurons.


### Remove samples on second-label margin
Samples are removed if they are on the boundary margin for the second label.

### Split the network
'+' and '-' buttons on edges decides whether to split the layer to two parts.

## Analysis
The right-most figure is the analysis where a point is blue when the new combination has both outputs correct there.
It is white if one of the output is correct.
It is orange if both outputs are incorrect.
In IID setting, we analyze new combinations for OOD-PP.
