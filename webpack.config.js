const path = require('path'),
      ExtractTextPlugin = require("extract-text-webpack-plugin"),
      HtmlWebpackPlugin = require('html-webpack-plugin'), // Create html file in dist folder with same props which is in src folder 
      CleanWebpackPlugin= require('clean-webpack-plugin'), // Delete dist folder and after it create new dist folder with new files 
      CopyWebpackPlugin = require('copy-webpack-plugin'); // Copy files for one folder to another (used for fonts)



            // Extract scss files from src folder to dist folder in css format 
const ETP = new ExtractTextPlugin('css/style.css'); 

/** Webpack Config  */
const conf = {

    context:path.resolve(__dirname , 'src'),
    entry:{
        app:[
            './js/index.js', // Entry point of js files 
            './css/style.css' // Entry point of scss files 
        ]
    },
    output:{
        path:path.resolve(__dirname , './dist'), // Output on the folder which is specified in the second argument 
        filename:'js/bundle.js', // Output for js file 
        publicPath:'dist' // Public path for browser (the folder will be created for browser even if the folder dose`t exist )
    },
    module:{
        rules:[
            // Js (use: babel-loader)
            {
                test:/\.js$/,
                exclude:/node_modules/,
                loader:'babel-loader' 
            },
            {
                test: /\.css$/,
                use:  ETP.extract({
                  fallback: 'style-loader',
                  use: 'css-loader',
                })
            },
        ],
    },
    devServer:{
        contentBase:path.resolve(__dirname , 'src') // Enter point for webpack-dev-server 
    },
    plugins:[
        ETP,
        new HtmlWebpackPlugin({
            filename:'index.html', // File which will be created  in dist folder 
            template:'index.html', 
            inject:false,
        }),
    ]
}


module.exports = (env , opt) => {
    

    let isProduction = opt.mode === 'production';

    /**
     * Plugins which used only from production mode 
     */
    if(isProduction)
        conf.plugins.push( new CleanWebpackPlugin(['dist']) ) 

    return conf;
}
